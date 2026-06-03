import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { inArray, eq, desc, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertToBase } from "@/lib/units";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "seller") {
    return NextResponse.json({ error: "Only sellers can place orders" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided in order" }, { status: 400 });
    }

    const productIds = items.map((item: any) => item.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Pre-validate all items before starting the transaction
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

      // Stock check
      const currentStock = Number(product.stockQuantity);
      if (currentStock < qtyInBaseUnit) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${currentStock} ${product.baseUnit}, Requested: ${qtyInBaseUnit} ${product.baseUnit}` },
          { status: 400 }
        );
      }

      totalAmount += lineTotal;

      orderItemsToInsert.push({
        productId: product.id,
        orderedQuantity: String(orderedQty),
        orderedUnit: item.orderedUnit,
        quantityInBaseUnit: String(qtyInBaseUnit),
        unitPriceSnapshot: String(basePrice),
        lineTotal: String(lineTotal),
      });
    }

    // Execute entire order creation + stock deduction in a single transaction
    const newOrder = await db.transaction(async (tx) => {
      // 1. Insert the order
      const [order] = await tx
        .insert(orders)
        .values({
          sellerId: session.user.id,
          status: "pending",
          totalAmount: String(Math.round(totalAmount * 100) / 100),
          notes: notes || null,
        })
        .returning();

      // 2. Insert all order items
      const itemsWithOrderId = orderItemsToInsert.map((item) => ({
        ...item,
        orderId: order.id,
      }));
      await tx.insert(orderItems).values(itemsWithOrderId);

      // 3. Deduct stock for each product
      for (const item of orderItemsToInsert) {
        await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${item.quantityInBaseUnit}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      return order;
    });

    return NextResponse.json({ orderId: newOrder.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Build base query for orders with seller name
    let ordersQuery;

    if (session.user.role === "admin") {
      // Admin sees all orders
      ordersQuery = await db
        .select({
          id: orders.id,
          sellerId: orders.sellerId,
          sellerName: users.name,
          sellerEmail: users.email,
          status: orders.status,
          totalAmount: orders.totalAmount,
          notes: orders.notes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .leftJoin(users, eq(orders.sellerId, users.id))
        .orderBy(desc(orders.createdAt));
    } else {
      // Seller sees only their own orders
      ordersQuery = await db
        .select({
          id: orders.id,
          sellerId: orders.sellerId,
          sellerName: users.name,
          sellerEmail: users.email,
          status: orders.status,
          totalAmount: orders.totalAmount,
          notes: orders.notes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .leftJoin(users, eq(orders.sellerId, users.id))
        .where(eq(orders.sellerId, session.user.id))
        .orderBy(desc(orders.createdAt));
    }

    // For each order, fetch its items with product names
    const ordersWithItems = await Promise.all(
      ordersQuery.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            productId: orderItems.productId,
            productName: products.name,
            productSku: products.sku,
            productBaseUnit: products.baseUnit,
            orderedQuantity: orderItems.orderedQuantity,
            orderedUnit: orderItems.orderedUnit,
            quantityInBaseUnit: orderItems.quantityInBaseUnit,
            unitPriceSnapshot: orderItems.unitPriceSnapshot,
            lineTotal: orderItems.lineTotal,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return { ...order, items };
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
