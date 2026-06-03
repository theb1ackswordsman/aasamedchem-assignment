"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/units";

interface RecentOrder {
  id: string;
  sellerName: string;
  status: string;
  totalAmount: string;
  createdAt: string;
}

interface DashboardData {
  totalProducts: number;
  pendingOrders: number;
  lowStockCount: number;
  totalRevenue: number;
  recentOrders: RecentOrder[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "pending", color: "bg-amber-100 text-amber-800" },
  confirmed: { label: "confirmed", color: "bg-blue-100 text-blue-800" },
  fulfilled: { label: "fulfilled", color: "bg-green-100 text-green-800" },
  cancelled: { label: "cancelled", color: "bg-gray-100 text-gray-600" },
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const shortId = (id: string) => id.slice(0, 8).toUpperCase();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-32 text-gray-500 bg-white">
        <p>Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white">
      <div>
        <h1 className="text-[22px] font-medium text-gray-900">Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-2">Total Products</p>
          <p className="text-[28px] font-medium tabular-nums text-gray-900 leading-none">
            {data.totalProducts.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Card 2: Pending Orders */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-2">Pending Orders</p>
          <p className={`text-[28px] font-medium tabular-nums leading-none ${data.pendingOrders > 0 ? "text-amber-600" : "text-gray-900"}`}>
            {data.pendingOrders.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Card 3: Low Stock Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-2">Low Stock Items</p>
          <p className={`text-[28px] font-medium tabular-nums leading-none ${data.lowStockCount > 0 ? "text-red-600" : "text-gray-900"}`}>
            {data.lowStockCount.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-2">Total Revenue</p>
          <p className="text-[28px] font-medium tabular-nums text-gray-900 leading-none">
            {formatINR(data.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-gray-500">RECENT ORDERS</h2>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
          {data.recentOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-[13px]">
              No orders yet.
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-gray-500 text-[11px] font-medium uppercase tracking-widest h-11">
                  <th className="px-6 py-2 font-medium">ORDER ID</th>
                  <th className="px-6 py-2 font-medium">SELLER</th>
                  <th className="px-6 py-2 font-medium">DATE</th>
                  <th className="px-6 py-2 font-medium text-center">ITEMS</th>
                  <th className="px-6 py-2 font-medium text-right">TOTAL</th>
                  <th className="px-6 py-2 font-medium text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-gray-700">
                {data.recentOrders.map((order, idx) => {
                  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

                  return (
                    <tr 
                      key={order.id} 
                      className={`h-11 border-b border-gray-100 last:border-0 ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"
                      }`}
                    >
                      <td className="px-6 py-2 font-mono text-[13px] text-gray-900">
                        {shortId(order.id)}
                      </td>
                      <td className="px-6 py-2 text-gray-950 font-medium">{order.sellerName}</td>
                      <td className="px-6 py-2 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-2 text-center text-gray-500">—</td>
                      <td className="px-6 py-2 text-right font-medium tabular-nums text-gray-900">
                        {formatINR(Number(order.totalAmount))}
                      </td>
                      <td className="px-6 py-2 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end">
          <Link href="/admin/orders" className="text-blue-600 hover:text-blue-700 text-[13px] font-medium">
            View all orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
