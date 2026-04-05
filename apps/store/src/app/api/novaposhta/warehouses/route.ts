import config from '@/config'
import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"

const API_URL = config.env.novaPoshta.apiEndpoint
const API_KEY = config.env.novaPoshta.apiKey

export async function POST(req: Request) {

  try {
    const { cityRef, searchNumber } = await req.json()

    if (!cityRef) {
      return NextResponse.json(
        { message: "City Ref is required" },
        { status: 400 },
      )
    }

    if (!API_URL || !API_KEY) {
      console.error("Missing Nova Poshta API configuration")
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 })
    }

    const methodProperties: Record<string, string | number> = {
      CityRef: cityRef,
    }

    if (searchNumber) {
      methodProperties.WarehouseId = searchNumber
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: "Address",
        calledMethod: "getWarehouses",
        methodProperties,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(
        { message: data.errors?.join(", ") || "Nova Poshta API error" },
        { status: 500 }
      )
    }

    return NextResponse.json(data.data || [], { status: 200 })

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
