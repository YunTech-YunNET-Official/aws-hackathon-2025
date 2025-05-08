import { NextResponse } from "next/server"
import { customers } from "@/lib/data/customers"

export async function GET() {
  try {
    // In a real application, this would fetch from a database
    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}
