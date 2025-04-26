import transcriptionService from '../services/transcriptionService.js';

class SocketController {
    /**
     * 初始化 Socket.IO 連接和事件處理
     * @param {Object} io Socket.IO 實例
     */
    initialize(io) {
        io.on('connection', this.handleConnection.bind(this));
    }

    /**
     * 處理新的客戶端連接
     * @param {Object} socket Socket.IO 客戶端連接
     */
    handleConnection(socket) {
        console.log('Client connected');

        // 使用 ref 對象來允許在閉包中修改這些值
        const state = {
            isTranscribing: { value: false },
            buffer: { value: Buffer.alloc(0) },
            globalTranscript: { value: '' }
        };

        // 註冊所有事件處理器
        this.registerEventHandlers(socket, state);
    }

    /**
     * 註冊所有事件處理器
     * @param {Object} socket Socket.IO 客戶端連接
     * @param {Object} state 狀態對象，包含 isTranscribing、buffer 和 globalTranscript
     */
    registerEventHandlers(socket, state) {
        socket.on('startTranscription', () => this.handleStartTranscription(socket, state));
        socket.on('audioData', (data) => this.handleAudioData(state, data));
        socket.on('stopTranscription', () => (state.isTranscribing.value = false));
        socket.on('disconnect', () => (state.isTranscribing.value = false));
    }

    /**
     * 處理開始轉錄請求
     * @param {Object} socket Socket.IO 客戶端連接
     * @param {Object} state 狀態對象
     */
    async handleStartTranscription(socket, state) {
        if (state.isTranscribing.value) return;
        
        state.isTranscribing.value = true;
        state.buffer.value = Buffer.alloc(0);
        state.globalTranscript.value = '';

        try {
            // 創建音頻流並開始轉錄
            const audioStream = transcriptionService.createAudioStream(
                state.buffer, 
                state.isTranscribing
            );

            const response = await transcriptionService.startStreamTranscription(audioStream);
            
            // 處理轉錄結果流
            this.processTranscriptionStream(socket, state, response);
        } catch (err) {
            console.error('Transcribe error:', err);
            socket.emit('error', `Transcribe error: ${err.message}`);
        }
    }

    /**
     * 處理音頻數據
     * @param {Object} state 狀態對象
     * @param {Buffer} data 收到的音頻數據
     */
    handleAudioData(state, data) {
        if (state.isTranscribing.value) {
            state.buffer.value = Buffer.concat([state.buffer.value, Buffer.from(data)]);
        }
    }

    /**
     * 處理轉錄結果流
     * @param {Object} socket Socket.IO 客戶端連接
     * @param {Object} state 狀態對象
     * @param {Object} response 轉錄響應
     */
    async processTranscriptionStream(socket, state, response) {
        try {
            for await (const evt of response.TranscriptResultStream) {
                const result = transcriptionService.processTranscriptEvent(evt);
                if (!result) continue;

                const { text, isPartial } = result;

                if (isPartial) {
                    socket.emit('transcription', { 
                        global: state.globalTranscript.value,
                        partial: text 
                    });
                } else {
                    // 最終結果：更新 global，partial 清空
                    state.globalTranscript.value += text + '<SEP>';
                    socket.emit('transcription', { 
                        global: state.globalTranscript.value,
                        partial: '' 
                    });
                }
            }
        } catch (err) {
            console.error('Error processing transcript stream:', err);
            socket.emit('error', `Error processing transcript: ${err.message}`);
        }
    }
}

export default new SocketController();