// Main application functionality for the phone sales system
document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const customerSelect = document.getElementById('customer-select');
    const attributesContainer = document.getElementById('attributes-container');
    const promptInput = document.getElementById('prompt-input');
    const openingInput = document.getElementById('opening-input');
    const conversationContainer = document.getElementById('conversation-container');
    const statusText = document.getElementById('statusText');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const clearButton = document.getElementById('clearButton');
    const historySelect = document.getElementById('history-select');
    const newConversationBtn = document.getElementById('new-conversation-btn');
    const reloadCustomersBtn = document.getElementById('reload-customers-btn');
    
    // Socket.IO 連線
    const socket = io();
    
    // 全域變數
    let currentCustomerId = null;
    let currentConversationId = null;
    let isRecording = false;
    let messageHistory = [];
    let isFirstInteraction = true;
    
    // TTS播放控制相關變數
    let currentAudio = null;
    let isTTSPlaying = false;
    let audioQueue = [];        // 音頻隊列
    let isProcessingQueue = false;  // 是否正在處理隊列
    const SOFT_PUNCTUATION = '、，：';  // 軟分段符號
    const HARD_PUNCTUATION = '！？。；';  // 硬分段符號
    let ttsSegments = [];       // TTS 分段文本
    
    // 載入客戶資料
    function loadCustomerData() {
        fetch('/admin/api/customers')
            .then(response => {
                if (!response.ok) throw new Error('獲取客戶資料失敗');
                return response.json();
            })
            .then(customers => {
                // 清空選項
                customerSelect.innerHTML = '<option value="">-- 請選擇客戶 --</option>';
                
                // 添加客戶選項
                customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.id;
                    
                    option.textContent = `客戶編號: ${customer.id}`;
                        
                    customerSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('載入客戶資料失敗:', error);
                alert('載入客戶資料失敗: ' + error.message);
            });
    }
    
    // 載入對話歷史
    function loadConversationHistory() {
        if (!currentCustomerId) return;
        
        console.log(`正在載入客戶 ID: ${currentCustomerId} 的對話歷史`);
        
        // 清空選項並顯示載入中
        historySelect.innerHTML = '<option value="">載入中...</option>';
        historySelect.disabled = true;
        
        fetch(`/api/conversations?customerId=${currentCustomerId}`)
            .then(response => {
                console.log('對話歷史 API 響應狀態:', response.status);
                if (!response.ok) throw new Error(`獲取對話歷史失敗 (${response.status})`);
                return response.json();
            })
            .then(conversations => {
                console.log('獲取到對話歷史:', conversations);
                
                // 清空選項
                historySelect.innerHTML = '<option value="">-- 選擇歷史對話 --</option>';
                historySelect.disabled = false;
                
                // 添加對話歷史選項
                if (conversations && conversations.length > 0) {
                    conversations.forEach(conv => {
                        const option = document.createElement('option');
                        option.value = conv.id;
                        
                        let dateStr = '未知時間';
                        try {
                            dateStr = new Date(conv.createdAt).toLocaleString();
                        } catch (e) {
                            console.error('日期轉換錯誤:', e);
                        }
                        
                        option.textContent = `對話 #${conv.id} - ${dateStr}`;
                        historySelect.appendChild(option);
                    });
                    console.log(`已載入 ${conversations.length} 個對話`);
                } else {
                    historySelect.innerHTML = '<option value="">無對話歷史</option>';
                    console.log('未找到對話歷史或返回空陣列');
                }
            })
            .catch(error => {
                console.error('載入對話歷史失敗:', error);
                historySelect.innerHTML = '<option value="">載入失敗</option>';
                historySelect.disabled = false;
                alert('載入對話歷史失敗: ' + error.message);
            });
    }
    
    // 選擇客戶
    customerSelect.addEventListener('change', function() {
        currentCustomerId = this.value ? parseInt(this.value) : null;
        
        if (currentCustomerId) {
            // 載入客戶屬性
            fetch(`/admin/api/customers/${currentCustomerId}`)
                .then(response => {
                    if (!response.ok) throw new Error('獲取客戶資料失敗');
                    return response.json();
                })
                .then(customer => {
                    // 顯示客戶屬性
                    attributesContainer.innerHTML = '';
                    
                    if (customer.attributes && customer.attributes.length > 0) {
                        customer.attributes.forEach(attr => {
                            const attrDiv = document.createElement('div');
                            attrDiv.className = 'attribute-item';
                            attrDiv.innerHTML = `
                                <span class="attribute-name">${attr.attribute}:</span> 
                                <span class="attribute-value">${attr.value}</span>
                            `;
                            attributesContainer.appendChild(attrDiv);
                        });
                        
                        // 自動建立 Prompt
                        generatePrompt(customer.attributes);
                    } else {
                        attributesContainer.innerHTML = '<p class="no-data">無客戶屬性資料</p>';
                    }
                    
                    // 載入對話歷史
                    loadConversationHistory();
                })
                .catch(error => {
                    console.error('載入客戶資料失敗:', error);
                    attributesContainer.innerHTML = '<p class="error">載入客戶資料失敗</p>';
                });
        } else {
            attributesContainer.innerHTML = '<p class="no-data">尚未選擇客戶</p>';
            promptInput.value = '';
        }
    });
    
    // 自動產生 Prompt
    function generatePrompt(attributes) {

        let attrText = ''

        attributes.forEach(attr => {
            attrText += `${attr.attribute}: ${attr.value}\n`;
        });
        
        promptInput.value = getPrompt(attrText);
    }
    
    // 建立新對話
    newConversationBtn.addEventListener('click', function() {
        if (!currentCustomerId) {
            alert('請先選擇客戶');
            return;
        }
        
        // 清空對話容器
        conversationContainer.innerHTML = '';
        messageHistory = [];
        
        // 建立新對話
        fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                customerId: currentCustomerId,
                prompt: promptInput.value
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('建立對話失敗');
            return response.json();
        })
        .then(data => {
            currentConversationId = data.id;
            alert('新對話建立成功');
            console.log('已建立新對話，ID:', currentConversationId);
            
            // 重新載入對話歷史
            loadConversationHistory();
        })
        .catch(error => {
            console.error('建立對話失敗:', error);
            alert('建立對話失敗: ' + error.message);
        });
    });
    
    // 載入歷史對話
    historySelect.addEventListener('change', function() {
        const conversationId = this.value;
        if (!conversationId) return;
        
        console.log('正在載入對話 ID:', conversationId);
        
        // 顯示載入狀態
        conversationContainer.innerHTML = '<div class="loading-message">載入對話中...</div>';
        
        fetch(`/api/conversations/${conversationId}`)
            .then(response => {
                console.log('對話詳情 API 響應狀態:', response.status);
                if (!response.ok) throw new Error(`獲取對話記錄失敗 (${response.status})`);
                return response.json();
            })
            .then(data => {
                console.log('載入的對話資料:', data);
                
                // 設置當前對話 ID
                currentConversationId = parseInt(data.id);
                
                // 載入提示
                promptInput.value = data.prompt || '';
                
                // 顯示對話記錄
                conversationContainer.innerHTML = '';
                messageHistory = [];
                
                if (data.messages && data.messages.length > 0) {
                    data.messages.forEach(msg => {
                        addMessage(msg.content, msg.role, new Date(msg.timestamp));
                    });
                    console.log(`已載入 ${data.messages.length} 條對話訊息`);
                } else {
                    conversationContainer.innerHTML = '<div class="info-message">此對話尚未有訊息</div>';
                    console.log('對話中沒有訊息');
                }
            })
            .catch(error => {
                console.error('載入對話記錄失敗:', error);
                conversationContainer.innerHTML = `<div class="error-message">載入失敗: ${error.message}</div>`;
                alert('載入對話記錄失敗: ' + error.message);
            });
    });
    
    // 重新載入客戶資料
    reloadCustomersBtn.addEventListener('click', loadCustomerData);
    
    // 開始對話
    startButton.addEventListener('click', function() {
        if (!currentCustomerId) {
            alert('請先選擇客戶');
            return;
        }
        
        if (!currentConversationId) {
            alert('請先建立或選擇一個對話');
            return;
        }
        
        if (isFirstInteraction) {
            // 顯示規劃中訊息
            const planningMessage = document.createElement('div');
            planningMessage.className = 'message system-message';
            planningMessage.id = 'planning-message';
            planningMessage.textContent = '規劃中...';
            conversationContainer.appendChild(planningMessage);
            conversationContainer.scrollTop = conversationContainer.scrollHeight;
            
            const openingText = openingInput.value.trim() || '開始對話';
            
            // 發送到 LLM 以獲取開場白
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: currentConversationId,
                    text: openingText,
                    customerId: currentCustomerId,
                    isOpening: true
                })
            })
            .then(response => {
                if (!response.ok) throw new Error('獲取 AI 回覆失敗');
                return response.json();
            })
            .then(data => {
                // 保存開場白資料，若有開場白內容則保存
                if (openingInput.value.trim()) {
                    saveMessage(openingInput.value.trim(), 'system');
                }
                
                // 獲取 TTS 但暫不顯示開場白
                console.log('獲取 TTS 中，開場白:', data.response.substring(0, 30) + '...');
                
                // 更新規劃中訊息
                const planningMsg = document.getElementById('planning-message');
                if (planningMsg) planningMsg.textContent = 'TTS 準備中...';
                
                // 先保存 AI 回應到資料庫
                saveMessage(data.response, 'assistant');
                
                // 若 API 返回了預先生成的 audioUrl，則直接使用
                if (data.audioUrl) {
                    // 移除規劃中訊息
                    if (planningMsg) planningMsg.remove();
                    
                    // 顯示 AI 開場白並播放語音
                    addMessage(data.response, 'assistant');
                    playAudio(data.audioUrl);
                    isFirstInteraction = false;
                    
                    // 啟動語音辨識
                    startRecording();
                } else {
                    // 否則需要單獨請求 TTS
                    fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: data.response })
                    })
                    .then(response => {
                        if (!response.ok) throw new Error(`TTS 處理失敗: ${response.status}`);
                        return response.json();
                    })
                    .then(ttsData => {
                        // 移除規劃中訊息
                        if (planningMsg) planningMsg.remove();
                        
                        // 顯示 AI 開場白並播放語音
                        addMessage(data.response, 'assistant');
                        
                        if (ttsData.audioUrl) {
                            playAudio(ttsData.audioUrl);
                        } else {
                            console.error('TTS 回應中沒有音頻 URL');
                        }
                        
                        isFirstInteraction = false;
                        
                        // 啟動語音辨識
                        startRecording();
                    })
                    .catch(error => {
                        console.error('TTS 處理失敗:', error);
                        
                        // 移除規劃中訊息
                        if (planningMsg) planningMsg.remove();
                        
                        // 仍然顯示開場白，但無法播放語音
                        addMessage(data.response, 'assistant');
                        alert('TTS 處理失敗: ' + error.message);
                        isFirstInteraction = false;
                        
                        // 啟動語音辨識
                        startRecording();
                    });
                }
            })
            .catch(error => {
                console.error('對話處理失敗:', error);
                
                // 移除規劃中訊息
                const planningMsg = document.getElementById('planning-message');
                if (planningMsg) planningMsg.remove();
                
                alert('對話處理失敗: ' + error.message);
            });
        } else {
            // 直接啟動語音辨識
            startRecording();
        }
    });
    
    // 結束對話
    stopButton.addEventListener('click', function() {
        stopRecording();
    });
    
    // 清除對話內容
    clearButton.addEventListener('click', function() {
        conversationContainer.innerHTML = '';
        messageHistory = [];
        isFirstInteraction = true;
    });
    
    // 添加訊息到對話容器
    function addMessage(text, role, timestamp = new Date()) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        // 內容
        const contentP = document.createElement('p');
        contentP.textContent = text;
        messageDiv.appendChild(contentP);
        
        // 時間戳
        const timeP = document.createElement('p');
        timeP.className = 'message-time';
        timeP.textContent = timestamp.toLocaleString();
        messageDiv.appendChild(timeP);
        
        // 添加到容器
        conversationContainer.appendChild(messageDiv);
        
        // 滾動到底部
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
        
        // 保存到歷史記錄
        messageHistory.push({ role, content: text });
    }
    
    // 保存訊息到資料庫
    function saveMessage(text, role) {
        if (!currentConversationId) return;
        
        fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId: currentConversationId,
                content: text,
                role: role
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('保存訊息失敗');
            return response.json();
        })
        .then(data => {
            console.log('訊息已保存，ID:', data.id);
        })
        .catch(error => {
            console.error('保存訊息失敗:', error);
        });
    }
    
    // 播放 TTS
    function playTTS(text) {
        console.log('正在處理 TTS 請求:', text.substring(0, 30) + '...');
        
        fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        })
        .then(response => {
            if (!response.ok) throw new Error(`TTS 處理失敗: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('收到 TTS 回應');
            
            if (data.audioUrl) {
                // 添加到音頻隊列並處理
                audioQueue.push(data.audioUrl);
                if (!isTTSPlaying) {
                    processAudioQueue();
                }
            } else {
                console.error('回應中沒有音頻 URL');
            }
        })
        .catch(error => {
            console.error('TTS 處理失敗:', error);
        });
    }
    
    // 播放音頻
    function playAudio(audioUrl) {
        console.log('播放音頻 (data URL)');
        
        // 如果有正在播放的音頻，先停止它
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        // 創建一個新的音頻元素
        const audio = new Audio();
        currentAudio = audio;
        
        // 設置音頻數據
        audio.src = audioUrl;
        
        // 設置TTS播放狀態
        isTTSPlaying = true;
        
        // 監聽錯誤
        audio.onerror = (e) => {
            console.error('音頻播放失敗:', e);
            isTTSPlaying = false;
            currentAudio = null;
            // 處理下一個音頻段落
            setTimeout(processAudioQueue, 1000);
        };
        
        // 監聽播放開始
        audio.onplay = () => {
            console.log('開始播放音頻');
            isTTSPlaying = true;
        };
        
        // 監聽播放結束
        audio.onended = () => {
            console.log('音頻播放完成');
            isTTSPlaying = false;
            currentAudio = null;
            // 處理音頻隊列中的下一個音頻，添加1秒延遲
            setTimeout(processAudioQueue, 1000);
        };
        
        // 播放音頻
        audio.play().catch(error => {
            console.error('播放音頻時發生錯誤:', error);
            isTTSPlaying = false;
            currentAudio = null;
            // 發生錯誤時也嘗試播放下一段
            setTimeout(processAudioQueue, 1000);
        });
    }
    
    // 將文本分段以便於 TTS 播放
    function segmentTTS(text) {
        console.log('分段 TTS 文本:', text);
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
        
        console.log('TTS 分段結果:', segments);
        return segments;
    }
    
    // 處理音頻隊列
    function processAudioQueue() {
        if (isProcessingQueue || audioQueue.length === 0) return;
        isProcessingQueue = true;
        
        const nextAudio = audioQueue.shift();
        playAudio(nextAudio);
        
        // 音頻播放完成後會在 onended 事件中調用 processAudioQueue 繼續處理隊列
        isProcessingQueue = false;
    }
    
    // 開始錄音
    function startRecording() {
        isRecording = true;
        startButton.disabled = true;
        stopButton.disabled = false;
        
        // 更新狀態指示器
        statusText.innerHTML = '正在錄音 <span class="status-indicator recording"></span>';
        
        // 請求瀏覽器錄音權限
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // 通知服務器開始錄音
                socket.emit('startGoogleCloudStream', { 
                    conversationId: currentConversationId,
                    customerId: currentCustomerId
                });
                
                // 配置音頻處理
                window.localStream = stream;
                window.localAudioStream = new MediaStream(stream.getAudioTracks());
                
                // 配置音頻處理器
                const audioContext = new AudioContext();
                const audioSource = audioContext.createMediaStreamSource(window.localAudioStream);
                const processor = audioContext.createScriptProcessor(1024, 1, 1);
                
                // 將音頻數據發送到服務器
                processor.onaudioprocess = function(e) {
                    if (!isRecording) return;
                    
                    const f32 = e.inputBuffer.getChannelData(0);
                    const i16 = new Int16Array(f32.length);
                    for (let i = 0; i < f32.length; ++i)
                        i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
                    socket.emit('binaryAudioData', i16.buffer);
                };
                
                audioSource.connect(processor);
                processor.connect(audioContext.destination);
                
                window.audioContext = audioContext;
                window.audioProcessor = processor;
            })
            .catch(error => {
                console.error('無法取得麥克風權限:', error);
                stopRecording();
                alert('無法取得麥克風權限: ' + error.message);
            });
    }
    
    // 停止錄音
    function stopRecording() {
        isRecording = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        
        // 更新狀態指示器
        statusText.innerHTML = '未錄音 <span class="status-indicator inactive"></span>';
        
        // 通知服務器停止錄音
        socket.emit('stopGoogleCloudStream');
        
        // 停止本地錄音
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (window.audioProcessor && window.audioContext) {
            window.audioProcessor.disconnect();
            window.audioContext.close().catch(() => console.log('關閉音頻上下文失敗'));
        }
    }
    
    // 將浮點數轉換為整數 (用於音頻傳輸)
    function convertFloat32ToInt16(buffer) {
        const l = buffer.length;
        const buf = new Int16Array(l);
        
        for (let i = 0; i < l; i++) {
            buf[i] = Math.min(1, buffer[i]) * 0x7FFF;
        }
        
        return buf;
    }
    
    // 監聽轉錄結果
    socket.on('transcription', function(data) {
        console.log('收到轉錄結果:', data);
        
        // 檢查是否應該打斷TTS播放
        if (isTTSPlaying && data.partial && data.partial.trim().length > 1) {
            console.log('用戶開始說話，打斷TTS播放');
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
                isTTSPlaying = false;
            }
        }
        
        // 顯示即時轉錄結果
        const transcriptDiv = document.createElement('div');
        transcriptDiv.className = 'transcript-container';
        transcriptDiv.innerHTML = `
            <div class="transcript-text">
                <span class="transcript-final">${data.global}</span>
                <span class="transcript-partial">${data.partial}</span>
            </div>
        `;
        
        // 替換或添加到界面
        const existingTranscript = document.querySelector('.transcript-container');
        if (existingTranscript) {
            existingTranscript.replaceWith(transcriptDiv);
        } else {
            conversationContainer.appendChild(transcriptDiv);
            conversationContainer.scrollTop = conversationContainer.scrollHeight;
        }
    });
    
    // 監聽最終轉錄結果
    socket.on('transcriptionFinal', function(data) {
        console.log('收到最終轉錄結果:', data);
        
        // 移除臨時的转錄容器
        const existingTranscript = document.querySelector('.transcript-container');
        if (existingTranscript) {
            existingTranscript.remove();
        }
        
        // 添加正式消息
        addMessage(data.text, data.role);
    });
    
    // 監聽 TTS 返回結果
    socket.on('tts', function(data) {
        if (data.audioUrl) {
            // 添加到音頻隊列中
            audioQueue.push(data.audioUrl);
            // 如果沒有正在播放的音頻，則開始處理隊列
            if (!isTTSPlaying) {
                processAudioQueue();
            }
        } else {
            console.error('TTS 返回中沒有音頻 URL');
        }
    });
    
    // 處理對話開始事件
    socket.on('conversationStarted', function(data) {
        console.log('對話已建立:', data);
        currentConversationId = data.id;
        loadConversationHistory();
    });
    
    // 處理錯誤事件
    socket.on('error', function(error) {
        console.error('Socket 錯誤:', error);
        alert('Socket 錯誤: ' + error);
        stopRecording();
    });
    
    // 初始載入
    loadCustomerData();
});