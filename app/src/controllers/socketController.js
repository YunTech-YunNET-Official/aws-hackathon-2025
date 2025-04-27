import { Server } from 'socket.io';
import { PrismaClient } from '../generated/prisma/index.js';
import { chat } from '../utils/llm.js';
import { synthesize } from '../utils/tts.js';
import config from '../config/index.js';
import { 
    TranscribeStreamingClient, 
    StartStreamTranscriptionCommand 
} from '@aws-sdk/client-transcribe-streaming';
import openCCConverter from '../utils/tw.js';

const prisma = new PrismaClient();
const s2tConverter = openCCConverter('cn', 'tw');

// AWS Transcribe client
const transcribeClient = new TranscribeStreamingClient({ region: config.aws.region });

// 文本分段使用的標點符號定義
const SOFT_PUNCTUATION = '、，：';  // 軟分段符號
const HARD_PUNCTUATION = '！？。；';  // 硬分段符號

class SocketController {
    /**
     * 初始化 Socket.IO 控制器
     * @param {Object} server HTTP服務器
     */
    initialize(server) {
        this.io = new Server(server);
        this.setupSocketHandlers();
    }

    /**
     * 設置 Socket.IO 事件處理
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('新的連線建立: ' + socket.id);
            
            // 存儲當前對話ID
            let currentConversationId = null;
            let currentCustomerId = null;
            let messageHistory = [];
            let systemPrompt = '';
            
            // AWS Transcribe 相關設定與資料
            let isTranscribing = false;
            let buffer = Buffer.alloc(0);
            let globalTranscript = "";
            let lastProcessedTranscript = "";
            
            // 追蹤最近的用戶訊息和處理狀態
            let lastUserMessageId = null;          // 最後一則用戶訊息ID
            let lastUserMessageTimestamp = null;   // 最後一則用戶訊息時間戳
            let activeRequestController = null;    // 活動中的請求控制器，用於取消請求
            let isProcessingResponse = false;      // 是否正在處理回應
            const MESSAGE_COMBINE_THRESHOLD = 2000; // 合併訊息的時間閾值（毫秒）

            // 開始語音辨識串流
            socket.on('startAWSStream', async (data) => {
                if (isTranscribing) return;
                
                if (data && data.conversationId) {
                    currentConversationId = data.conversationId;
                    if (data.customerId) {
                        currentCustomerId = data.customerId;
                    }
                    
                    // 獲取對話資訊，包含 prompt
                    try {
                        const conversation = await prisma.conversation.findUnique({
                            where: { id: parseInt(currentConversationId) }
                        });
                        
                        if (conversation) {
                            systemPrompt = conversation.prompt || '';
                            console.log(`對話 #${currentConversationId} 的系統提示:`, systemPrompt);
                        }
                    } catch (err) {
                        console.error('獲取對話資訊失敗:', err);
                    }
                    
                    // 載入對話歷史
                    try {
                        const messages = await prisma.message.findMany({
                            where: { conversationId: parseInt(currentConversationId) },
                            orderBy: { timestamp: 'asc' }
                        });
                        
                        messageHistory = messages.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }));
                        
                        console.log(`已載入對話 #${currentConversationId} 的歷史訊息，共 ${messageHistory.length} 條`);
                    } catch (err) {
                        console.error('載入對話歷史失敗:', err);
                    }
                }
                
                // 啟動語音辨識
                isTranscribing = true;
                buffer = Buffer.alloc(0);
                globalTranscript = "";
                lastProcessedTranscript = "";
                
                console.log('開始語音辨識串流', currentConversationId);
                
                /** 產生器：每隔一段時間把累積的 buffer 丟給 AWS */
                const audioStream = (async function* () {
                    while (isTranscribing) {
                        await new Promise((r) => setTimeout(r, config.chunkIntervalMs));
                        if (buffer.length) {
                            yield { AudioEvent: { AudioChunk: buffer } };
                            buffer = Buffer.alloc(0);
                        }
                    }
                })();

                const command = new StartStreamTranscriptionCommand({
                    LanguageCode: config.aws.transcribe.defaultLanguage,
                    MediaSampleRateHertz: config.aws.transcribe.sampleRate,
                    MediaEncoding: config.aws.transcribe.encoding,
                    AudioStream: audioStream,
                });

                try {
                    const response = await transcribeClient.send(command);
                    
                    for await (const evt of response.TranscriptResultStream) {
                        if (!evt.TranscriptEvent) continue;
                        const results = evt.TranscriptEvent.Transcript.Results;
                        if (!results.length) continue;

                        const alt = results[0].Alternatives[0];
                        if (!alt) continue;

                        const txt = alt.Transcript ?? "";
                        const isPartial = results[0].IsPartial;

                        if (isPartial) {
                            socket.emit("transcription", { global: globalTranscript, partial: txt });
                        } else {
                            // 最終結果：更新 global transcript
                            globalTranscript += txt;
                            socket.emit("transcription", { global: globalTranscript, partial: "" });
                            processTranscription(txt.trim());
                            lastProcessedTranscript = globalTranscript;
                        }
                    }
                } catch (err) {
                    console.error("Transcribe error:", err);
                    socket.emit("error", "Transcribe error: " + err.message);
                    isTranscribing = false;
                }
            });
            
            // 接收語音資料
            socket.on('binaryAudioData', (data) => {
                if (!isTranscribing) return;
                buffer = Buffer.concat([buffer, Buffer.from(data)]);
            });
            
            // 處理轉錄結果的函數
            async function processTranscription(transcribedText) {
                if (!transcribedText || !currentConversationId) return;
                
                console.log('處理轉錄結果:', transcribedText);
                
                const now = new Date();
                let isContinuedMessage = false;
                
                // 檢查是否為連續訊息（短時間內連續發送）
                if (lastUserMessageId && lastUserMessageTimestamp && 
                    (now.getTime() - lastUserMessageTimestamp.getTime() < MESSAGE_COMBINE_THRESHOLD)) {
                    isContinuedMessage = true;
                    console.log('連續訊息檢測：合併訊息');
                    
                    // 如果有活動中的請求，嘗試取消它
                    if (activeRequestController) {
                        console.log('取消現有的 LLM 請求');
                        activeRequestController.abort();
                        activeRequestController = null;
                    }
                    
                    // 清空音頻隊列並停止所有播放中的 TTS
                    if (socket.audioQueue) {
                        console.log('清空音頻隊列');
                        socket.audioQueue = [];
                    }
                    
                    try {
                        // 從資料庫中獲取先前的訊息
                        const previousMessage = await prisma.message.findUnique({
                            where: { id: lastUserMessageId }
                        });
                        
                        if (previousMessage) {
                            // 合併文本
                            const combinedText = previousMessage.content + " " + transcribedText;
                            
                            // 更新資料庫中的訊息
                            await prisma.message.update({
                                where: { id: lastUserMessageId },
                                data: { content: combinedText }
                            });
                            
                            // 更新本地歷史
                            // 找到並更新最後一條用戶訊息
                            const userMsgIndex = messageHistory.findIndex(msg => 
                                msg.role === 'user' && 
                                msg.content === previousMessage.content);
                            
                            if (userMsgIndex !== -1) {
                                messageHistory[userMsgIndex].content = combinedText;
                            }
                            
                            // 更新前端顯示
                            socket.emit('messageUpdate', {
                                id: lastUserMessageId,
                                text: combinedText,
                                role: 'user'
                            });
                            
                            // 使用合併後的訊息進行處理
                            transcribedText = combinedText;
                        }
                    } catch (error) {
                        console.error('合併訊息失敗:', error);
                        // 失敗時，繼續處理當前訊息作為新訊息
                        isContinuedMessage = false;
                    }
                }

                // 非合併訊息時，發送到前端顯示並保存新訊息
                if (!isContinuedMessage) {
                    // 立即發送到前端顯示對話內容
                    socket.emit('transcriptionFinal', {
                        text: s2tConverter(transcribedText),
                        role: 'user'
                    });
                    
                    // 保存用戶訊息到資料庫
                    try {
                        const userMessage = await prisma.message.create({
                            data: {
                                conversationId: parseInt(currentConversationId),
                                content: transcribedText,
                                role: 'user'
                            }
                        });
                        
                        console.log('用戶訊息已保存，ID:', userMessage.id);
                        
                        // 更新追蹤變数
                        lastUserMessageId = userMessage.id;
                        lastUserMessageTimestamp = new Date();
                        
                        // 更新歷史
                        messageHistory.push({
                            role: 'user',
                            content: transcribedText
                        });
                    } catch (err) {
                        console.error('保存用戶訊息失敗:', err);
                    }
                } else {
                    // 更新時間戳以便於追蹤連續訊息
                    lastUserMessageTimestamp = new Date();
                }
                
                // 標記為正在處理中
                isProcessingResponse = true;
                
                // 創建可取消的請求控制器
                activeRequestController = new AbortController();
                
                // 準備處理 LLM 請求
                let systemPromptLocal = systemPrompt;
                let llmResponse = null;
                
                try {
                    // 從資料庫取得對話
                    const conversation = await prisma.conversation.findUnique({
                        where: { id: parseInt(currentConversationId) }
                    });
                    
                    if (!conversation) {
                        throw new Error('找不到對話記錄');
                    }
                    
                    systemPromptLocal = conversation.prompt || '';
                    
                    // 處理 LLM 請求，使用 AbortController 信號
                    const signal = activeRequestController.signal;
                    
                    const [response, newHistory] = await chat(transcribedText, {
                        model: 'nova-pro',
                        system: systemPromptLocal,
                        history: messageHistory,
                        signal: signal // 傳遞取消信號（注意：需要在 llm.js 中支援這個參數）
                    });
                    
                    llmResponse = response;
                    
                    // 如果處理過程被取消，結束此次處理
                    if (signal.aborted) {
                        console.log('LLM 請求已被取消');
                        activeRequestController = null;
                        isProcessingResponse = false;
                        return;
                    }
                    
                    // 檢查是否為合併訊息對應的舊回應，需要更新
                    if (isContinuedMessage) {
                        // 找到最後一條助理訊息
                        const lastAssistantMsg = await prisma.message.findFirst({
                            where: { 
                                conversationId: parseInt(currentConversationId),
                                role: 'assistant'
                            },
                            orderBy: {
                                timestamp: 'desc'
                            }
                        });
                        
                        // 如果存在，則更新它
                        if (lastAssistantMsg) {
                            await prisma.message.update({
                                where: { id: lastAssistantMsg.id },
                                data: { content: response }
                            });
                            
                            // 更新本地歷史
                            const assistantMsgIndex = messageHistory.findLastIndex(msg => 
                                msg.role === 'assistant');
                            
                            if (assistantMsgIndex !== -1) {
                                messageHistory[assistantMsgIndex].content = response;
                            } else {
                                // 如果沒找到，就添加新的
                                messageHistory.push({
                                    role: 'assistant',
                                    content: response
                                });
                            }
                        } else {
                            // 如果沒有前一條助理訊息，創建一個新的
                            await prisma.message.create({
                                data: {
                                    conversationId: parseInt(currentConversationId),
                                    content: response,
                                    role: 'assistant'
                                }
                            });
                            
                            // 更新本地歷史
                            messageHistory.push({
                                role: 'assistant',
                                content: response
                            });
                        }
                        
                        // 通知前端更新助理訊息
                        socket.emit('messageUpdate', {
                            text: s2tConverter(response),
                            role: 'assistant',
                            isReplace: true
                        });
                    } else {
                        // 保存新的 AI 回應
                        const assistantMessage = await prisma.message.create({
                            data: {
                                conversationId: parseInt(currentConversationId),
                                content: response,
                                role: 'assistant'
                            }
                        });
                        
                        console.log('AI 回應已保存，ID:', assistantMessage.id);
                        
                        // 更新本地歷史
                        messageHistory.push({
                            role: 'assistant',
                            content: response
                        });
                        
                        // 發送到前端顯示對話內容
                        socket.emit('transcriptionFinal', {
                            text: s2tConverter(response),
                            role: 'assistant'
                        });
                    }
                    
                    // 清空現有音頻隊列
                    socket.emit('clearAudioQueue');
                    
                    // 建立一個獨特的 TTS 批次 ID，用於取消舊的處理
                    const ttsProcessId = Date.now();
                    socket.currentTTSProcessId = ttsProcessId;
                    
                    // 將LLM回應進行分段
                    const socketController = new SocketController();
                    const textSegments = socketController.segmentText(response);
                    
                    // 非同步處理TTS，不等待每個段落完成
                    (async () => {
                        for (let i = 0; i < textSegments.length; i++) {
                            const segment = textSegments[i];
                            if (!segment.trim()) continue;
                            
                            try {
                                // 如果處理已被取消，或 process ID 不匹配，則停止
                                if (socket.currentTTSProcessId !== ttsProcessId ||
                                    (activeRequestController && activeRequestController.signal.aborted)) {
                                    console.log('TTS 處理已被取消');
                                    break;
                                }
                                
                                const audioBuffer = await synthesize(segment);
                                
                                // 再次檢查 process ID 是否仍然匹配
                                if (socket.currentTTSProcessId !== ttsProcessId) {
                                    console.log('TTS 處理已過期，放棄發送');
                                    break;
                                }
                                
                                const base64Audio = audioBuffer.toString('base64');
                                const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;
                                
                                // 發送語音到前端播放
                                socket.emit('tts', { 
                                    audioUrl: audioDataUrl,
                                    isNewResponse: i === 0, // 只有第一段標記為新回應
                                    segmentIndex: i
                                });
                                
                                // 添加短暫延遲以防止同時發送太多請求
                                await new Promise(resolve => setTimeout(resolve, 50));
                            } catch (error) {
                                console.error(`處理第 ${i+1} 段文本 TTS 失敗:`, error);
                            }
                        }
                    })();
                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.log('請求已被使用者取消');
                    } else {
                        console.error('LLM 處理失敗:', error);
                        socket.emit('error', 'LLM 處理失敗: ' + error.message);
                    }
                } finally {
                    // 無論成功或失敗，重設狀態
                    activeRequestController = null;
                    isProcessingResponse = false;
                }
            }
            
            // 停止語音辨識串流
            socket.on('stopAWSStream', () => {
                isTranscribing = false;
                console.log('語音辨識串流結束');
            });
            
            // 開始新對話
            socket.on('startNewConversation', async (data) => {
                try {
                    if (!data || !data.customerId) {
                        throw new Error('缺少客戶ID');
                    }
                    
                    // 建立新對話
                    const conversation = await prisma.conversation.create({
                        data: {
                            customerId: parseInt(data.customerId),
                            prompt: data.prompt || '',
                        }
                    });
                    
                    currentConversationId = conversation.id;
                    currentCustomerId = data.customerId;
                    systemPrompt = data.prompt || '';
                    messageHistory = [];
                    
                    // 將 prompt 作為 system 訊息保存
                    if (systemPrompt) {
                        await prisma.message.create({
                            data: {
                                conversationId: parseInt(currentConversationId),
                                content: systemPrompt,
                                role: 'system'
                            }
                        });
                        
                        // 更新歷史
                        messageHistory.push({
                            role: 'system',
                            content: systemPrompt
                        });
                    }
                    
                    socket.emit('conversationStarted', {
                        id: conversation.id,
                        message: '對話建立成功'
                    });
                    
                } catch (error) {
                    console.error('建立對話失敗:', error);
                    socket.emit('error', '建立對話失敗: ' + error.message);
                }
            });
            
            // 斷開連接
            socket.on('disconnect', () => {
                console.log('連線關閉: ' + socket.id);
                isTranscribing = false;
                buffer = Buffer.alloc(0);
            });
        });
    }
    
    /**
     * 將文本分段以便於 TTS 播放
     * @param {string} text - 輸入文本
     * @returns {Array<string>} - 分段後的文本數組
     */
    segmentText(text) {
        console.log('分段 TTS 文本');
        const segments = [];
        let currentSegment = '';
        let softSegment = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            currentSegment += char;
            softSegment += char;
            
            // 處理硬分段 (強制分段)
            if (HARD_PUNCTUATION.includes(char)) {
                segments.push(currentSegment);
                currentSegment = '';
                softSegment = '';
            }
            // 處理軟分段 (容納兩個段落)
            else if (SOFT_PUNCTUATION.includes(char) && softSegment.length >= 2) {
                // 如果累積了兩個軟分段，就進行分段
                const matches = softSegment.match(new RegExp(`[${SOFT_PUNCTUATION}]`, 'g'));
                if (matches && matches.length >= 2) {
                    segments.push(currentSegment);
                    currentSegment = '';
                    softSegment = '';
                }
            }
        }
        
        // 添加最後剩餘的文本 (如果有的話)
        if (currentSegment) {
            segments.push(currentSegment);
        }
        
        console.log(`TTS 分段結果: ${segments.length} 個段落`);
        return segments;
    }
}

export default new SocketController();