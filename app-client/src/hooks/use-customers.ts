"use client"

import { useState, useEffect } from "react"
import type { Customer } from "@/lib/types"
import { fetchCustomers } from "@/lib/api-client"

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCustomers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchCustomers()
      setCustomers(data)
    } catch (err) {
      console.error("Failed to load customers:", err)
      setError("無法載入客戶資料")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const refresh = () => {
    loadCustomers()
  }

  return { customers, isLoading, error, refresh }
}
