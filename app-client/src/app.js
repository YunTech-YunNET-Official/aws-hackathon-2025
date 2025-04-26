import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import {
    TranscribeStreamingClient,
    StartStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHUNK_INTERVAL_MS = 20;          // ← 每 20 ms 送一次
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Fix the static file path to properly serve CSS files
app.use(express.static(path.join(__dirname, "../src")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "templates/index.html")));

const transcribeClient = new TranscribeStreamingClient({ region: "us-west-2" });

io.on("connection", (socket) => {
    console.log("client connected");

    let isTranscribing = false;
    let buffer = Buffer.alloc(0);        // 收到的音訊都累積到這裡
    let globalTranscript = "";             // 已經「定稿」的部分

    socket.on("startTranscription", async () => {
        if (isTranscribing) return;
        isTranscribing = true;
        buffer = Buffer.alloc(0);
        globalTranscript = "";

        /** 產生器：每 20 ms 把目前累積的 buffer 丟給 AWS */
        const audioStream = (async function* () {
            while (isTranscribing) {
                await new Promise((r) => setTimeout(r, CHUNK_INTERVAL_MS));
                if (buffer.length) {
                    yield { AudioEvent: { AudioChunk: buffer } };
                    buffer = Buffer.alloc(0);
                }
            }
        })();

        const command = new StartStreamTranscriptionCommand({
            LanguageCode: "zh-CN",
            MediaSampleRateHertz: 44100,
            MediaEncoding: "pcm",
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
                    // 最終結果：更新 global，partial 清空
                    globalTranscript += txt + "<SEP>";
                    socket.emit("transcription", { global: globalTranscript, partial: "" });
                }
            }
        } catch (err) {
            console.error("Transcribe error:", err);
            socket.emit("error", "Transcribe error: " + err.message);
        }
    });

    // 只負責把音訊累積到 buffer，實際送出交給 audioStream
    socket.on("audioData", (data) => {
        if (isTranscribing) buffer = Buffer.concat([buffer, Buffer.from(data)]);
    });

    socket.on("stopTranscription", () => (isTranscribing = false));
    socket.on("disconnect", () => (isTranscribing = false));
});

server.listen(process.env.PORT || 3000, () =>
    console.log(`Server running at http://localhost:${process.env.PORT || 3000}`),
);
