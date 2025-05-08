import type { Customer } from "./types"

const customers: Customer[] = [
  {
    id: "customer1",
    name: "張小明",
    company: "台北科技有限公司",
    details: {
      姓名: "張小明",
      電話: "0912-345-678",
      公司: "台北科技有限公司",
      Email: "ming.chang@techco.com.tw",
      上次聯絡: "2023/04/15",
      客戶級別: "A級",
      標籤: ["潛在客戶", "已報價"],
      備註: "客戶對我們的雲端解決方案表示高度興趣，特別是關於資料安全性的部分。上次通話中提到他們正在評估幾家供應商，預計下個季度做決定。需要提供更多關於我們安全認證和案例研究的資料。",
      預算範圍: "NT$500,000 - NT$800,000",
      決策者: "林總經理",
      競爭對手: "全球科技、創新數位",
    },
  },
  {
    id: "customer2",
    name: "李大華",
    company: "創新數位股份有限公司",
    details: {
      姓名: "李大華",
      電話: "0922-123-456",
      公司: "創新數位股份有限公司",
      Email: "david.lee@innovation.com.tw",
      上次聯絡: "2023/05/20",
      客戶級別: "B級",
      標籤: ["新客戶", "需追蹤"],
      備註: "客戶剛開始接觸我們的產品，對價格較為敏感。需要提供更多成本效益分析和競爭優勢說明。",
      預算範圍: "NT$300,000 - NT$500,000",
      決策者: "李經理",
      競爭對手: "台灣科技、數位方案",
    },
  },
  {
    id: "customer3",
    name: "王美玲",
    company: "全球貿易集團",
    details: {
      姓名: "王美玲",
      電話: "0933-987-654",
      公司: "全球貿易集團",
      Email: "mei.wang@globaltrade.com",
      上次聯絡: "2023/06/05",
      客戶級別: "VIP",
      標籤: ["長期客戶", "擴展需求"],
      備註: "長期合作客戶，目前正在考慮擴大採購規模。對服務品質和售後支援特別重視，需要提供專屬的解決方案。",
      預算範圍: "NT$1,000,000+",
      決策者: "王董事長",
      競爭對手: "國際系統、企業方案",
    },
  },
]

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((customer) => customer.id === id)
}

export function getAllCustomers(): Customer[] {
  return customers
}
