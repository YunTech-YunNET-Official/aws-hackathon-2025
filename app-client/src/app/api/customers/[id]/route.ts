import { NextResponse } from "next/server"
import { customers } from "@/lib/data/customers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const customer = customers.find((c) => c.id === id)

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}
