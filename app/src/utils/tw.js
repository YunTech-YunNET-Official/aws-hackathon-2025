import * as OpenCC from 'opencc-js'

/**
 * 建立一個繁簡轉換器
 * @param fromLang 原始語言 (如: 'cn' 表示簡體中文)
 * @param targetLang 目標語言 (如: 'tw' 表示繁體中文臺灣)
 * @returns 轉換函數，接受一個字符串並返回轉換後的字符串
 */
export default function openCCConverter(fromLang, targetLang) {
  return OpenCC.Converter({ from: fromLang, to: targetLang })
}

/**
 * 使用範例：
 * 
 * import openCCConverter from './Utils/OpenCC'
 * 
 * // 建立一個從簡體轉繁體(臺灣)的轉換器
 * const openCC = openCCConverter('cn', 'tw')
 * 
 * // 進行文字轉換
 * const traditionalText = openCC('你好，这是简体中文')
 */