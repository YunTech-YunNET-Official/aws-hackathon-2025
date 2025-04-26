// tts.js
import { writeFile } from 'node:fs/promises';
import { tts } from '../config';

/**
 * 語音合成
 * @param {Object}  opts
 * @param {string}  opts.text             - 要合成的文字
 * @param {string}  [opts.textLanguage=zh] - 文字語言代碼
 * @param {string}  [opts.cutPunc="，。"]   - 斷句標點
 * @param {string}  [opts.url=http://localhost:9880/] - TTS 服務位址
 * @returns {Promise<Buffer>}             - 二進位 wav 資料
 */
export async function synthesize({
  text,
  textLanguage = 'zh',
  cutPunc = tts.cutPunc,
  url = tts.url,
} = {}) {
  if (!text) throw new Error('text 參數不可為空');

  const payload = {
    text,
    text_language: textLanguage,
    cut_punc: cutPunc
  };

  const t0 = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`TTS 服務回傳錯誤：${res.status} ${res.statusText}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const wavBuf = Buffer.from(arrayBuf);

  const ms = (performance.now() - t0).toFixed(1);
  console.log(`TTS 請求耗時 ${ms} ms`);

  return wavBuf;
}