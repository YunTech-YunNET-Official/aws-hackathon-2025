"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { AudioRecorder, createAudioFormData } from "./utils/audio";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [messages, setMessages] = useState<{
    role: "user" | "agent";
    text: string;
    status?: "recording" | "transcribing" | "generating" | "speaking";
  }[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stopRecording();
      }
      
      // Release object URL to avoid memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.name || !customerData.phone) return;
    
    setIsRecording(true);
    setMessages([
      { role: "agent", text: "通話開始，我正在聆聽中...", status: "recording" }
    ]);
    
    // Initialize and start the audio recorder
    recorderRef.current = new AudioRecorder(
      handleSpeechDetected,
      (volume) => setVolumeLevel(volume)
    );
    
    const success = await recorderRef.current.startRecording();
    if (!success) {
      setIsRecording(false);
      setMessages([
        { role: "agent", text: "無法啟動錄音，請確認麥克風權限已開啟。", status: undefined }
      ]);
    }
  };
  
  const handleStopConversation = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording();
      recorderRef.current = null;
    }
    
    setIsRecording(false);
    setMessages(prev => [
      ...prev,
      { role: "agent", text: "通話已結束，感謝您的時間。", status: undefined }
    ]);
    
    // Release audio URL if any
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleSpeechDetected = async (audioBlob: Blob) => {
    if (!isRecording) return;
    
    // Show user is speaking
    setMessages(prev => [
      ...prev,
      { role: "user", text: "正在錄音...", status: "recording" }
    ]);
    
    try {
      // Create FormData with the audio blob
      const formData = createAudioFormData(audioBlob);
      
      // Update message status to show transcribing
      setMessages(prev => 
        prev.map((msg, i) => 
          i === prev.length - 1 ? { ...msg, status: "transcribing" } : msg
        )
      );
      
      // Send to STT API
      const sttResponse = await fetch('/api/stt', {
        method: 'POST',
        body: formData
      });
      
      if (!sttResponse.ok) {
        throw new Error('STT API error: ' + sttResponse.statusText);
      }
      
      const { user_text } = await sttResponse.json();
      
      // Update with transcribed text
      setMessages(prev => 
        prev.map((msg, i) => 
          i === prev.length - 1 ? { ...msg, text: user_text, status: undefined } : msg
        )
      );
      
      // Show generating message for the agent
      setMessages(prev => [
        ...prev,
        { role: "agent", text: "正在生成回覆...", status: "generating" }
      ]);
      
      // Call the LLM API
      const llmResponse = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_text, context: customerData })
      });
      
      if (!llmResponse.ok) {
        throw new Error('LLM API error: ' + llmResponse.statusText);
      }
      
      const { reply_text } = await llmResponse.json();
      
      // Update with LLM response and mark as speaking
      setMessages(prev => 
        prev.map((msg, i) => 
          i === prev.length - 1 ? { ...msg, text: reply_text, status: "speaking" } : msg
        )
      );
      
      // Call TTS API
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply_text })
      });
      
      if (!ttsResponse.ok) {
        throw new Error('TTS API error: ' + ttsResponse.statusText);
      }
      
      // Get the audio blob and create an object URL
      const ttsBlob = await ttsResponse.blob();
      
      // Clean up previous audio URL if any
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      const url = URL.createObjectURL(ttsBlob);
      setAudioUrl(url);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        
        // When audio ends, mark message as completed
        audioRef.current.onended = () => {
          setMessages(prev => 
            prev.map((msg, i) => 
              i === prev.length - 1 ? { ...msg, status: undefined } : msg
            )
          );
        };
      }
    } catch (error) {
      console.error("Error in speech processing:", error);
      setMessages(prev => [
        ...prev,
        { role: "agent", text: "處理對話時發生錯誤，請重試。", status: undefined }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Logo */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-md p-4 text-white">
        <div className="container mx-auto flex items-center">
          <h1 className="text-2xl font-bold">電話銷售系統</h1>
          <div className="ml-auto text-sm">
            {isRecording && <span className="animate-pulse">● 錄音中</span>}
          </div>
        </div>
      </header>

      {/* Main Content - Full Height without scrollbars */}
      <main className="flex flex-1 p-4 gap-4 overflow-hidden flex-col md:flex-row">
        {/* Left Column - Customer Form */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-lg p-6 overflow-y-auto">
          <form onSubmit={handleStartConversation}>
            <h2 className="text-xl font-bold mb-6 text-gray-800">客戶資料</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  客戶姓名 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={customerData.name}
                  onChange={handleInputChange}
                  disabled={isRecording}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="請輸入客戶姓名"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  聯絡電話 *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={customerData.phone}
                  onChange={handleInputChange}
                  disabled={isRecording}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="請輸入電話號碼"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  電子郵件
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customerData.email}
                  onChange={handleInputChange}
                  disabled={isRecording}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="請輸入電子郵件"
                />
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  備註
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={customerData.notes}
                  onChange={handleInputChange}
                  disabled={isRecording}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="其他相關資訊"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-8">
              {!isRecording ? (
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-md text-white font-medium transition-all shadow-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-lg"
                >
                  開始對話
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopConversation}
                  className="w-full py-3 px-4 rounded-md text-white font-medium transition-all shadow-md bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 hover:shadow-lg"
                >
                  結束對話
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Right Column - Conversation */}
        <div className="w-full md:w-2/3 bg-white rounded-lg shadow-lg p-6 flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex justify-between items-center">
            <span>對話內容</span>
            {isRecording && (
              <span className="text-sm font-normal px-2 py-1 bg-gray-100 rounded-full flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  volumeLevel > 0.05 ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                }`}></span>
                語音監聽中
              </span>
            )}
          </h2>
          
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                填寫客戶資料並點擊「開始對話」按鈕以開始交談
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-xl p-3 ${
                        message.role === "user" 
                          ? "bg-gray-100 text-gray-800" 
                          : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                      }`}
                    >
                      <p>{message.text}</p>
                      {message.status && (
                        <div className="text-xs mt-1 opacity-75">
                          {message.status === "recording" && "🎤 正在錄音..."}
                          {message.status === "transcribing" && "🔄 轉文字中..."}
                          {message.status === "generating" && "💭 生成回覆中..."}
                          {message.status === "speaking" && (
                            <span className="flex items-center">
                              <span className="inline-block w-3 h-3 mr-1 bg-white animate-pulse rounded-full opacity-75"></span>
                              正在播放語音...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {isRecording && (
            <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-700 border-t border-gray-200">
              <div className="flex items-center">
                <span className="text-xs text-gray-500">音量</span>
              </div>
              
              {/* Audio level visualizer */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-100"
                  style={{ width: `${Math.min(volumeLevel * 100 * 5, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Audio element for TTS playback (hidden) */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
