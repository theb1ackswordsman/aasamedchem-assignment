import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (dimension !== undefined) updateData.dimension = dimension;
    if (baseUnit !== undefined) updateData.baseUnit = baseUnit;
    if (basePrice !== undefined) updateData.basePrice = String(basePrice);
    if (stockQuantity !== undefined) updateData.stockQuantity = String(stockQuantity);
    if (minOrderQuantity !== undefined) updateData.minOrderQuantity = String(minOrderQuantity);
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("PUT /api/products/[id] error:", error);
    if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("Key (sku)")) {
      return NextResponse.json({ error: "Product SKU must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
