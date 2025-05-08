// llm.mjs

const MODEL_MAP = {
    'nova-pro': 'us.amazon.nova-pro-v1:0',
    'nova-lite': 'us.amazon.nova-lite-v1:0',
    'nova-micro': 'us.amazon.nova-micro-v1:0',
    'claude-3.7': 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    'deepseek-r1': 'us.deepseek.r1-v1:0',
};

/**
 * 與 LLM 對話
 * @param {string} prompt               - 使用者輸入
 * @param {Object} [opts]            - 選項
 * @param {"nova-pro"|"nova-lite"|"nova-micro"|"claude-3.7"|"deepseek-r1"} [opts.model] - 模型名稱
 * @param {string} [opts.system]        - system 指令 (首次呼叫時加入)
 * @param {Array<{role:"user"|"assistant"|"system",content:string}>} [opts.history] - 歷史對話紀錄
 * @param {AbortSignal} [opts.signal]   - 用於取消請求的信號
 * @returns {Promise<[string, Array]>}  - [assistant 回應, 更新後 history]
 */
export async function chat(
    prompt,
    {
        model,
        system,
        history,
        signal,
    } = {},
) {
    if (!prompt) throw new Error('prompt 參數不可為空');
    if (!model) throw new Error('model 參數不可為空');
    const apiKey = process.env.OPENAI_API_KEY;
    const BASE_URL = process.env.AWS_BEDROCK_ENDPOINT;
    if (!apiKey) throw new Error('請先設定環境變數 OPENAI_API_KEY');
    if (!BASE_URL) throw new Error('請先設定環境變數 AWS_BEDROCK_ENDPOINT');

    const userMsg = { role: 'user', content: prompt };
    const msgs = history ? [...history, userMsg] : [userMsg];
    if (!history && system) msgs.unshift({ role: 'system', content: system });

    // 添加選項物件，可能包含 signal
    const fetchOptions = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL_MAP[model] ?? model,
            messages: msgs,
        })
    };

    // 如果提供了 AbortSignal，加入到 fetch 選項中
    if (signal) {
        fetchOptions.signal = signal;
    }

    const res = await fetch(`${BASE_URL}/chat/completions`, fetchOptions);

    // 檢查是否被取消（AbortError 會在 fetch 層拋出）
    if (!res.ok) {
        const errTxt = await res.text().catch(() => res.statusText);
        throw new Error(`LLM 服務錯誤：${res.status} ${errTxt}`);
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content ?? '';
    const newHistory = [...msgs, { role: 'assistant', content: response }];

    return [response, newHistory];
}
