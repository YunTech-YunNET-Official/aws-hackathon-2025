import { NextResponse } from "next/server";

// This is a mock API for LLM-based response generation
// In a real application, you would integrate with an actual LLM service
export async function POST(request: Request) {
  try {
    const { user_text, context } = await request.json();
    
    if (!user_text) {
      return NextResponse.json(
        { error: "No user text provided" },
        { status: 400 }
      );
    }

    // Mock processing time (1000-2000ms)
    await new Promise(resolve => 
      setTimeout(resolve, Math.random() * 1000 + 1000)
    );
    
    // Generate a response based on the user's input
    // In a real application, this would call an actual LLM API
    let reply_text = "";
    
    if (user_text.includes("產品") || user_text.includes("服務")) {
      reply_text = `${context.name}您好，感謝您的詢問！我們提供多種產品和服務，從基礎套餐到高階客製化方案都有。根據您的需求，我推薦您可以先嘗試我們的入門方案，包含核心功能和一個月的免費諮詢服務。您想了解更具體的哪一方面呢？`;
    } 
    else if (user_text.includes("價格") || user_text.includes("優惠")) {
      reply_text = `我理解價格是一個重要的考量因素。針對${context.name}您的情況，我們有專屬的折扣計畫。如果您今天決定購買，可以享有85折的優惠，另外還可以獲得3個月的延長保固。這個方案是限時的，您覺得如何呢？`;
    }
    else if (user_text.includes("功能") || user_text.includes("細節")) {
      reply_text = `我們的產品具備市場領先的幾項特色功能：智能數據分析、全天候技術支援，以及高度客製化的使用者介面。特別是數據分析功能，能幫助您的業務提升至少20%的效率。${context.name}先生/小姐，根據您的需求，這些功能是否符合您的期望呢？`;
    }
    else if (user_text.includes("考慮") || user_text.includes("時間")) {
      reply_text = `我完全理解您需要更多時間做決定。這是一個重要的投資。我可以先提供您一些詳細的產品資料，讓您有更充分的資訊來評估。另外，我們也有14天的試用期，${context.name}您可以無風險地體驗我們的服務。您希望我通過什麼方式發送這些資料給您呢？`;
    }
    else if (user_text.includes("保固") || user_text.includes("保證")) {
      reply_text = `關於保固，我們的標準方案提供一年的全面保固服務，涵蓋所有技術問題和定期維護。如果您選擇我們的高階方案，保固期可以延長至三年。另外，${context.name}您註冊會員後，還可以享有額外的保障服務。這樣的保固範圍是否符合您的需求呢？`;
    }
    else {
      reply_text = `${context.name}您好，感謝您的問題。我們致力於提供最優質的服務和產品。根據您的需求，我們可以為您量身打造最適合的解決方案。請問您對哪個方面最感興趣呢？我可以提供更多相關的詳細資訊。`;
    }
    
    return NextResponse.json({ reply_text });
  } catch (error) {
    console.error("Error in LLM API:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}