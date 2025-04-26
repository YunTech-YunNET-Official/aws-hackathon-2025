// Initialize socket.io
const socket = io();
let audioCtx, source, proc;

document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById("statusText");
    const transcriptEl = document.getElementById("transcript");

    document.getElementById("startButton").onclick = start;
    document.getElementById("stopButton").onclick = stop;
    document.getElementById("clearButton").onclick = () => (transcriptEl.textContent = "");

    // Start audio recording and transcription
    async function start() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new AudioContext();
        source = audioCtx.createMediaStreamSource(stream);
        proc = audioCtx.createScriptProcessor(1024, 1, 1);
        source.connect(proc);
        proc.connect(audioCtx.destination);

        proc.onaudioprocess = (e) => {
            const f32 = e.inputBuffer.getChannelData(0);
            const i16 = new Int16Array(f32.length);
            for (let i = 0; i < f32.length; ++i)
                i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
            socket.emit("audioData", i16.buffer);
        };

        socket.emit("startTranscription");
        statusEl.textContent = "Recording🔴";
    }

    // Stop audio recording and transcription
    function stop() {
        if (!audioCtx) return;
        source.disconnect(); 
        proc.disconnect(); 
        audioCtx.close();
        socket.emit("stopTranscription");
        statusEl.textContent = "Not recording⚪";
    }

    // Handle real-time transcription updates
    socket.on("transcription", ({ global, partial }) => {
        transcriptEl.textContent = global + partial;
    });
    
    // Handle error messages
    socket.on("error", (msg) => console.error(msg));
});