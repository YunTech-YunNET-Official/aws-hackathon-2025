import { NextResponse } from "next/server";

// This is a mock API for converting speech to text
// In a real application, you would integrate with an actual STT service
export async function POST(request: Request) {
  try {
    // Get the audio blob from the request
    // In a real app, this would be passed to an STT service
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Mock processing time (500-1500ms)
    await new Promise(resolve => 
      setTimeout(resolve, Math.random() * 1000 + 500)
    );
    
    // Mock responses for simulation purposes
    const mockResponses = [
      "您好，我想了解一下貴公司的產品和服務",
      "這個價格對我來說有點高，有沒有什麼優惠方案",
      "請問這個產品有什麼特殊功能呢？",
      "我需要更多時間考慮一下",
      "這個服務的保固期限是多久？",
      "我想進一步了解產品的細節",
    ];
    
    // Return a random mock response
    return NextResponse.json({
      user_text: mockResponses[Math.floor(Math.random() * mockResponses.length)]
    });
  } catch (error) {
    console.error("Error in STT API:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}