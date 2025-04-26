"use client";

// Handles audio recording with Voice Activity Detection (VAD)
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private isRecording = false;
  private silenceDetectionThreshold = 0.01; // Threshold for silence detection
  private silenceTimer: NodeJS.Timeout | null = null;
  private silenceTimeout = 800; // 0.8 seconds of silence to trigger end
  private onSpeechEnd: (audioBlob: Blob) => void;
  private onVolumeChange: (volume: number) => void;
  
  constructor(
    onSpeechEnd: (audioBlob: Blob) => void,
    onVolumeChange?: (volume: number) => void
  ) {
    this.onSpeechEnd = onSpeechEnd;
    this.onVolumeChange = onVolumeChange || (() => {});
  }
  
  public async startRecording(): Promise<boolean> {
    try {
      // Request permission to access the microphone
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create a new recorder instance
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      
      // Set up audio processing for VAD
      this.setupVAD();
      
      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      return false;
    }
  }
  
  public stopRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) return;
    
    this.isRecording = false;
    this.mediaRecorder.stop();
    
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    // Cleanup
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyzer = null;
    }
  }
  
  private setupVAD(): void {
    if (!this.stream) return;
    
    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyzer = this.audioContext.createAnalyser();
    this.analyzer.fftSize = 256;
    source.connect(this.analyzer);
    
    // Start monitoring audio levels
    this.monitorAudioLevel();
  }
  
  private monitorAudioLevel(): void {
    if (!this.isRecording || !this.analyzer || !this.audioContext) return;
    
    // Create data array for frequency analysis
    const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analyzer.getByteFrequencyData(dataArray);
    
    // Calculate average volume level
    let sum = 0;
    for (const value of dataArray) {
      sum += value;
    }
    const average = sum / dataArray.length / 255; // Normalize to 0-1
    
    // Notify volume change
    this.onVolumeChange(average);
    
    // Check for silence
    if (average < this.silenceDetectionThreshold) {
      if (!this.silenceTimer) {
        // Start silence timer if not already running
        this.silenceTimer = setTimeout(() => {
          // Silence detected for the threshold duration
          if (this.isRecording && this.mediaRecorder) {
            // Stop the current recording segment
            this.mediaRecorder.stop();
            
            // Create a blob from the recorded chunks
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Reset for next segment
            this.audioChunks = [];
            
            // Notify that speech has ended
            this.onSpeechEnd(audioBlob);
            
            // Restart recording for the next segment if still active
            if (this.isRecording) {
              this.mediaRecorder.start(100);
            }
          }
          
          this.silenceTimer = null;
        }, this.silenceTimeout);
      }
    } else if (this.silenceTimer) {
      // Reset silence timer if sound is detected
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    // Continue monitoring
    if (this.isRecording) {
      requestAnimationFrame(() => this.monitorAudioLevel());
    }
  }
}

// Helper function to convert audio blob to base64 for API transmission
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to create a FormData object from an audio blob
export const createAudioFormData = (blob: Blob): FormData => {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  return formData;
};