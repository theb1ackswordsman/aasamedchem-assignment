import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq, ilike, or, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const dimension = searchParams.get("dimension") || "";

  try {
    let conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        )
      );
    }

    if (dimension) {
      conditions.push(eq(products.dimension, dimension));
    }

    const query = db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        categoryId: products.categoryId,
        categoryName: categories.name,
        dimension: products.dimension,
        baseUnit: products.baseUnit,
        basePrice: products.basePrice,
        stockQuantity: products.stockQuantity,
        minOrderQuantity: products.minOrderQuantity,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));

    const results = conditions.length > 0 
      ? await query.where(and(...conditions))
      : await query;

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      sku,
      description,
      categoryId,
      dimension,
      baseUnit,
      basePrice,
      stockQuantity,
      minOrderQuantity,
      isActive,
    } = body;

    if (!name || !sku || !dimension || !baseUnit || basePrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        sku,
        description,
        categoryId: categoryId || null,
        dimension,
        baseUnit,
        basePrice: String(basePrice),
        stockQuantity: stockQuantity ? String(stockQuantity) : "0",
        minOrderQuantity: minOrderQuantity ? String(minOrderQuantity) : "1",
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("Key (sku)")) {
      return NextResponse.json({ error: "Product SKU must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
