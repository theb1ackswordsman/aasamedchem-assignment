import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const list = await db.select().from(categories);
    return NextResponse.json(list);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
