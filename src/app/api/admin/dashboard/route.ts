import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, orders, users } from "@/db/schema";
import { eq, ne, sql, desc, count } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // Total products count
    const [productsCount] = await db
      .select({ count: count() })
      .from(products);

    // Pending orders count
    const [pendingCount] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));

    // Low stock count: stock_quantity < (min_order_quantity * 5)
    const [lowStockCount] = await db
      .select({ count: count() })
      .from(products)
      .where(
        sql`CAST(${products.stockQuantity} AS NUMERIC) < (CAST(${products.minOrderQuantity} AS NUMERIC) * 5)`
      );

    // Total revenue: sum of total_amount where status != 'cancelled'
    const [revenueResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS NUMERIC)), 0)`,
      })
      .from(orders)
      .where(ne(orders.status, "cancelled"));

    // Recent orders (last 10) with seller names
    const recentOrders = await db
      .select({
        id: orders.id,
        sellerName: users.name,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.sellerId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return NextResponse.json({
      totalProducts: productsCount.count,
      pendingOrders: pendingCount.count,
      lowStockCount: lowStockCount.count,
      totalRevenue: Number(revenueResult.total),
      recentOrders,
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
