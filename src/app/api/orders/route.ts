import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertToBase } from "@/lib/units";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided in order" }, { status: 400 });
    }

    const productIds = items.map((item) => item.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let totalAmount = 0;
    const orderItemsToInsert: any[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      if (!product.isActive) {
        return NextResponse.json({ error: `Product is inactive: ${product.name}` }, { status: 400 });
      }

      const orderedQty = parseFloat(item.orderedQuantity);
      if (isNaN(orderedQty) || orderedQty <= 0) {
        return NextResponse.json({ error: `Invalid quantity for product ${product.name}` }, { status: 400 });
      }

      const qtyInBaseUnit = convertToBase(orderedQty, item.orderedUnit);
      const basePrice = Number(product.basePrice);
      const lineTotal = Math.round(qtyInBaseUnit * basePrice * 100) / 100;

      totalAmount += lineTotal;

      orderItemsToInsert.push({
        productId: product.id,
        orderedQuantity: String(orderedQty),
        orderedUnit: item.orderedUnit,
        quantityInBaseUnit: String(qtyInBaseUnit),
        unitPriceSnapshot: String(basePrice),
        lineTotal: String(lineTotal)
      });
    }

    const newOrder = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          sellerId: session.user.id,
          status: "pending",
          totalAmount: String(Math.round(totalAmount * 100) / 100),
          notes: notes || null
        })
        .returning();

      const itemsWithOrderId = orderItemsToInsert.map((item) => ({
        ...item,
        orderId: order.id
      }));

      await tx.insert(orderItems).values(itemsWithOrderId);

      return order;
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
