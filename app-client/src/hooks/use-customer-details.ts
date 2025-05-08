"use client"

import { useState, useEffect } from "react"
import type { Customer } from "@/lib/types"
import { fetchCustomerById } from "@/lib/api-client"

export function useCustomerDetails(customerId: string | null) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customerId) {
      setCustomer(null)
      return
    }

    const loadCustomerDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchCustomerById(customerId)
        setCustomer(data)
      } catch (err) {
        console.error("Failed to load customer details:", err)
        setError("無法載入客戶資料，請稍後再試。")
        setCustomer(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomerDetails()
  }, [customerId])

  return { customer, isLoading, error }
}
