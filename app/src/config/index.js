import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');

const config = {
    port: process.env.PORT || 3000,
    chunkIntervalMs: 20,
    aws: {
        region: 'us-west-2',
        transcribe: {
            defaultLanguage: 'zh-CN',
            sampleRate: 44100,
            encoding: 'pcm'
        }
    },
    paths: {
        static: path.join(rootDir, 'src'),
        templates: path.join(rootDir, 'src/templates')
    },
    tts: {
        url: process.env.TTS_URL || 'http://localhost:9880/',
        cutPunc: process.env.TTS_CUT_PUNC || '，。'
    },
};

export default config;