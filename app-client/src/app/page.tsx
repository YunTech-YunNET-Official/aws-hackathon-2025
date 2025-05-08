import { PhoneSalesSystem } from "@/components/phone-sales-system"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "電話銷售互動平台",
  description: "專業的電話銷售互動平台，提供客戶管理、對話記錄和 AI 輔助功能",
}

export default function Home() {
  return <PhoneSalesSystem />
}
