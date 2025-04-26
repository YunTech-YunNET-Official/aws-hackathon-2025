import { Server } from 'socket.io';
import { PrismaClient } from '../generated/prisma/index.js';
import { chat } from '../utils/llm.js';
import { synthesize } from '../utils/tts.js';
import config from '../config/index.js';
import { 
    TranscribeStreamingClient, 
    StartStreamTranscriptionCommand 
} from '@aws-sdk/client-transcribe-streaming';

const prisma = new PrismaClient();

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
            
            // 開始語音辨識串流
            socket.on('startGoogleCloudStream', async (data) => {
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
                            // 最終結果：更新 global，檢查是否有 <SEP> 需要處理
                            globalTranscript += txt + "<SEP>";
                            socket.emit("transcription", { global: globalTranscript, partial: "" });
                            
                            // 處理完整語句，發送到前端進行顯示
                            const currentText = globalTranscript.substring(lastProcessedTranscript.length);
                            if (currentText.includes("<SEP>")) {
                                const segments = currentText.split("<SEP>");
                                for (let i = 0; i < segments.length - 1; i++) {
                                    const segment = segments[i].trim();
                                    if (segment) {
                                        await processTranscription(segment);
                                    }
                                }
                                lastProcessedTranscript = globalTranscript;
                            }
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
                
                try {
                    console.log('處理轉錄結果:', transcribedText);
                    
                    // 發送到前端顯示對話內容
                    socket.emit('transcriptionFinal', {
                        text: transcribedText,
                        role: 'user'
                    });
                    
                    // 保存用戶訊息
                    const userMessage = await prisma.message.create({
                        data: {
                            conversationId: parseInt(currentConversationId),
                            content: transcribedText,
                            role: 'user'
                        }
                    });
                    
                    // 更新歷史
                    messageHistory.push({
                        role: 'user',
                        content: transcribedText
                    });
                    
                    // 從資料庫取得對話
                    const conversation = await prisma.conversation.findUnique({
                        where: { id: parseInt(currentConversationId) }
                    });
                    
                    if (!conversation) {
                        throw new Error('找不到對話記錄');
                    }
                    
                    systemPrompt = conversation.prompt || '';
                    
                    // 處理 LLM 請求
                    const [response, newHistory] = await chat(transcribedText, {
                        model: 'nova-pro',
                        system: systemPrompt,
                        history: messageHistory
                    });
                    
                    // 保存 AI 回應
                    const assistantMessage = await prisma.message.create({
                        data: {
                            conversationId: parseInt(currentConversationId),
                            content: response,
                            role: 'assistant'
                        }
                    });
                    
                    // 更新歷史
                    messageHistory.push({
                        role: 'assistant',
                        content: response
                    });
                    
                    // 發送到前端顯示對話內容
                    socket.emit('transcriptionFinal', {
                        text: response,
                        role: 'assistant'
                    });
                    
                    // 將LLM回應進行分段
                    const socketController = new SocketController();
                    const textSegments = socketController.segmentText(response);
                    
                    // 依序處理每個分段並發送至前端
                    for (let i = 0; i < textSegments.length; i++) {
                        const segment = textSegments[i];
                        if (!segment.trim()) continue;
                        
                        try {
                            // 合成語音
                            const audioBuffer = await synthesize(segment);
                            
                            // 將音頻緩衝區轉換為 base64 數據 URL
                            const base64Audio = audioBuffer.toString('base64');
                            const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;
                            
                            // 發送語音到前端播放
                            socket.emit('tts', { audioUrl: audioDataUrl });
                        } catch (error) {
                            console.error(`處理第 ${i+1} 段文本 TTS 失敗:`, error);
                        }
                    }
                    
                } catch (error) {
                    console.error('處理轉錄結果失敗:', error);
                    socket.emit('error', '處理轉錄結果失敗: ' + error.message);
                }
            }
            
            // 停止語音辨識串流
            socket.on('stopGoogleCloudStream', () => {
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