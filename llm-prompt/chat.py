from openai import OpenAI
import os # 新增 import

# 初始化 LLM
llm = OpenAI(
    api_key="UseMyAWSAPIKey2ConnectBedrockServices",
    base_url="http://Bedroc-Proxy-bfEoObxQMbwe-1721205086.us-west-2.elb.amazonaws.com/api/v1",
)

# 可選模型
models = {
    "1": "us.amazon.nova-pro-v1:0",
    "2": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    "3": "us.deepseek.r1-v1:0"
}

# 讀取 system prompt 的內容
prompt_file_path = os.path.join(os.path.dirname(__file__), "second_prompt.md")
try:
    with open(prompt_file_path, 'r', encoding='utf-8') as f:
        system_prompt_content = f.read()
except FileNotFoundError:
    print(f"錯誤：找不到檔案 {prompt_file_path}")
    system_prompt_content = "你是一位有幫助的 AI 助理。" # 提供預設值

def main():
    # 選擇模型
    print("請選擇模型：")
    print("1. Nova Pro")
    print("2. Claude 3 Sonnet")
    print("3. Deepseek")
    model_choice = input("請輸入模型編號 (1/2/3)：").strip()
    model = models.get(model_choice, "us.amazon.nova-pro-v1:0")

    # 初始化對話，使用讀取的 prompt 內容
    messages = [
        {
            "role": "system",
            "content": system_prompt_content, # 使用讀取的檔案內容
        },
        {
            "role": "user",
            "content": """
            clentInfo = 
            {
              "客代": 1,
              "基本類別": {
                "性別": "女",
                "年齡區間": "60-69",
                "星座": "天蠍座",
                "居住縣市": "台北市文山區",
                "會員等級": "B級會員",
                "會員年資分組": "10年以上-15年以下"
              },
              "保健": {
                "可推薦商品類別": ["強化靈活關節", "眼睛保健", "腸胃保健"],
                "是否有高健康意識": "是"
              },
              "旅遊": {
                "旅遊國家偏好": ["日韓", "歐美"],
                "有無旅遊偏好": "有"
              },
              "生活": {
                "有無生活用品偏好": "有"
              },
              "美容": {
                "有無美容偏好": "有",
                "美妝保養類型偏好": "護膚SPA"
              },
              "食品": {
                "有無食品偏好": "有",
                "是否曾留學過素食": "是"
              },
              "寵物": {
                "有無養寵物": "有",
                "寵物類型": "狗"
              }
            }
            """,
        },
    ]

    print("\n--- AI 東森客服聊天室 ---")
    print("輸入 'exit' 離開聊天室\n")

    # 取得 AI 對客戶資訊的初始回應
    res = llm.chat.completions.create(
        model=model,
        messages=messages,
        temperature=1,
    )
    initial_response = res.choices[0].message.content.strip()
    print(f"AI：{initial_response}")
    messages.append({"role": "assistant", "content": initial_response})

    # 開始對話循環
    while True:
        user_input = input("\n你：")
        if user_input.lower() == "exit":
            print("結束聊天。")
            break

        messages.append({"role": "user", "content": user_input})
        res = llm.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0,
        )
        ai_reply = res.choices[0].message.content.strip()
        print(f"AI：{ai_reply}")
        messages.append({"role": "assistant", "content": ai_reply})

if __name__ == "__main__":
    main()