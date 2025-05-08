// API client functions for making requests to the backend

// Fetch all customers
export async function fetchCustomers() {
  try {
    const response = await fetch("/api/customers")
    if (!response.ok) {
      throw new Error("Failed to fetch customers")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching customers:", error)
    throw error
  }
}

// Fetch a single customer by ID
export async function fetchCustomerById(id: string) {
  try {
    const response = await fetch(`/api/customers/${id}`)
    if (!response.ok) {
      throw new Error("Failed to fetch customer")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching customer:", error)
    throw error
  }
}

// Fetch conversation histories for a customer
export async function fetchConversationHistories(customerId: string) {
  try {
    const response = await fetch(`/api/conversations?customerId=${customerId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch conversation histories")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching conversation histories:", error)
    throw error
  }
}

// Fetch a specific conversation by ID
export async function fetchConversationById(conversationId: string) {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch conversation")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching conversation:", error)
    throw error
  }
}
