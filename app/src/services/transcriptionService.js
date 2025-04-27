import {
    TranscribeStreamingClient,
    StartStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming';
import config from '../config/index.js';

class TranscriptionService {
    constructor() {
        this.client = new TranscribeStreamingClient({ region: config.aws.region });
    }

    /**
     * 創建音頻流生成器
     * @param {Buffer} buffer 音頻緩衝區的引用
     * @param {Boolean} isTranscribing 是否處於轉錄狀態的引用
     * @returns {AsyncGenerator} 音頻流生成器
     */
    createAudioStream(buffer, isTranscribing) {
        return (async function* () {
            while (isTranscribing.value) {
                await new Promise((r) => setTimeout(r, config.chunkIntervalMs));
                if (buffer.value.length) {
                    yield { AudioEvent: { AudioChunk: buffer.value } };
                    buffer.value = Buffer.alloc(0);
                }
            }
        })();
    }

    /**
     * 開始流式轉錄
     * @param {AsyncGenerator} audioStream 音頻流生成器
     * @param {String} languageCode 語言代碼
     * @returns {Promise<Object>} 轉錄響應
     */
    async startStreamTranscription(audioStream, languageCode = config.aws.transcribe.defaultLanguage) {
        const command = new StartStreamTranscriptionCommand({
            LanguageCode: languageCode,
            MediaSampleRateHertz: config.aws.transcribe.sampleRate,
            MediaEncoding: config.aws.transcribe.encoding,
            AudioStream: audioStream,
        });

        return this.client.send(command);
    }

    /**
     * 處理轉錄結果
     * @param {Object} event 轉錄事件
     * @returns {Object|null} 處理後的轉錄結果，如果沒有有效結果則返回 null
     */
    processTranscriptEvent(event) {
        if (!event.TranscriptEvent) return null;
        const results = event.TranscriptEvent.Transcript.Results;
        if (!results.length) return null;

        const alt = results[0].Alternatives[0];
        if (!alt) return null;

        return {
            text: alt.Transcript || "",
            isPartial: results[0].IsPartial
        };
    }
}

export default new TranscriptionService();