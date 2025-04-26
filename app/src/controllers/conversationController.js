import { PrismaClient } from '../generated/prisma/index.js';
import { chat } from '../utils/llm.js';
import { synthesize } from '../utils/tts.js';
import express from 'express';

const prisma = new PrismaClient();

// 文本分段使用的標點符號定義
const SOFT_PUNCTUATION = '、，：';  // 軟分段符號
const HARD_PUNCTUATION = '！？。；';  // 硬分段符號

class ConversationController {
    /**
     * 初始化對話控制器
     * @param {Object} app Express 應用實例
     */
    initialize(app) {
        this.setupConversationRoutes(app);
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

    /**
     * 設置對話相關路由
     * @param {Object} app Express 應用實例
     */
    setupConversationRoutes(app) {
        const router = express.Router();
        
        // 獲取客戶的所有對話
        router.get('/api/conversations', async (req, res) => {
            try {
                const { customerId } = req.query;
                
                if (!customerId) {
                    return res.status(400).json({ error: '缺少客戶ID參數' });
                }
                
                const conversations = await prisma.conversation.findMany({
                    where: {
                        customerId: parseInt(customerId)
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                
                res.json(conversations);
            } catch (error) {
                console.error('獲取對話列表失敗:', error);
                res.status(500).json({ error: '獲取對話列表失敗' });
            }
        });

        // 獲取特定對話及其訊息
        router.get('/api/conversations/:id', async (req, res) => {
            try {
                const conversationId = parseInt(req.params.id);
                
                const conversation = await prisma.conversation.findUnique({
                    where: {
                        id: conversationId
                    },
                    include: {
                        messages: {
                            orderBy: {
                                timestamp: 'asc'
                            }
                        }
                    }
                });
                
                if (!conversation) {
                    return res.status(404).json({ error: '找不到對話記錄' });
                }
                
                res.json(conversation);
            } catch (error) {
                console.error('獲取對話記錄失敗:', error);
                res.status(500).json({ error: '獲取對話記錄失敗' });
            }
        });

        // 建立新對話
        router.post('/api/conversations', express.json(), async (req, res) => {
            try {
                const { customerId, prompt } = req.body;
                
                if (!customerId) {
                    return res.status(400).json({ error: '缺少客戶ID' });
                }
                
                const customer = await prisma.customer.findUnique({
                    where: { id: parseInt(customerId) }
                });
                
                if (!customer) {
                    return res.status(404).json({ error: '找不到客戶資料' });
                }
                
                const conversation = await prisma.conversation.create({
                    data: {
                        customerId: parseInt(customerId),
                        prompt: prompt || '',
                    }
                });
                
                // 保存 prompt 作為 system 訊息
                if (prompt) {
                    await prisma.message.create({
                        data: {
                            conversationId: conversation.id,
                            content: prompt,
                            role: 'system'
                        }
                    });
                }
                
                res.status(201).json({ success: true, id: conversation.id, message: '對話建立成功' });
            } catch (error) {
                console.error('建立對話失敗:', error);
                res.status(500).json({ error: '建立對話失敗' });
            }
        });

        // 處理對話訊息
        router.post('/api/chat', express.json(), async (req, res) => {
            try {
                const { conversationId, text, customerId, history, isOpening } = req.body;
                
                if (!conversationId || !text) {
                    return res.status(400).json({ error: '缺少必要參數' });
                }
                
                // 獲取對話記錄和客戶資料
                const conversation = await prisma.conversation.findUnique({
                    where: { id: parseInt(conversationId) },
                    include: { 
                        customer: {
                            include: { attributes: true }
                        }
                    }
                });
                
                if (!conversation) {
                    return res.status(404).json({ error: '找不到對話記錄' });
                }
                
                // 獲取之前的對話訊息作為歷史記錄
                const messages = history || await prisma.message.findMany({
                    where: { conversationId: parseInt(conversationId) },
                    orderBy: { timestamp: 'asc' }
                });
                
                // 將訊息轉換為 LLM 可用的格式
                const messageHistory = messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
                
                // 如果是開場白，加入特殊提示詞
                let promptText = conversation.prompt;
                if (isOpening) {
                    promptText = `${conversation.prompt}\n\n這是對話的開始，請你作為銷售人員主動開場，介紹自己並開始對話。開場白須簡短友善，並能引起客戶興趣。`;
                }
                
                // 處理 LLM 請求
                const [response, newHistory] = await chat(text, {
                    model: 'nova-pro',  // 或其他適合的模型
                    system: promptText,
                    history: messageHistory
                });
                
                // 將使用者輸入儲存到資料庫，但僅在非開場模式或有實際輸入內容時
                if (!isOpening || text !== '開始對話') {
                    await prisma.message.create({
                        data: {
                            conversationId: parseInt(conversationId),
                            role: 'user',
                            content: text
                        }
                    });
                }
                
                // 將 AI 回應儲存到資料庫
                await prisma.message.create({
                    data: {
                        conversationId: parseInt(conversationId),
                        role: 'assistant',
                        content: response
                    }
                });
                
                // 合成語音
                const audioBuffer = await synthesize(response);
                
                // 將音頻緩衝區轉換為 base64 數據 URL
                const base64Audio = audioBuffer.toString('base64');
                const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;
                
                res.json({
                    response,
                    audioUrl: audioDataUrl
                });
            } catch (error) {
                console.error('處理對話失敗:', error);
                res.status(500).json({ error: '處理對話失敗: ' + error.message });
            }
        });

        // 保存對話訊息
        router.post('/api/messages', express.json(), async (req, res) => {
            try {
                const { conversationId, content, role } = req.body;
                
                if (!conversationId || !content || !role) {
                    return res.status(400).json({ error: '缺少必要參數' });
                }
                
                const message = await prisma.message.create({
                    data: {
                        conversationId: parseInt(conversationId),
                        content,
                        role
                    }
                });
                
                res.status(201).json({ success: true, id: message.id });
            } catch (error) {
                console.error('保存訊息失敗:', error);
                res.status(500).json({ error: '保存訊息失敗' });
            }
        });

        // TTS API 端點
        router.post('/api/tts', express.json(), async (req, res) => {
            try {
                const { text } = req.body;
                
                if (!text) {
                    return res.status(400).json({ error: '缺少文字內容' });
                }
                
                // 調用 TTS 服務
                const audioBuffer = await synthesize(text);
                
                // 將音頻緩衝區轉換為 base64 數據 URL
                const base64Audio = audioBuffer.toString('base64');
                const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;
                
                res.json({ audioUrl: audioDataUrl });
            } catch (error) {
                console.error('TTS 處理失敗:', error);
                res.status(500).json({ error: '語音合成失敗' });
            }
        });
        
        // API 路由前綴
        app.use('/', router);
    }
}

export default new ConversationController();