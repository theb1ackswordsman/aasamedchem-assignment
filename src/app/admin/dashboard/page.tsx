"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Clock,
  AlertTriangle,
  IndianRupee,
  Loader2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Truck,
} from "lucide-react";
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: CheckCircle2 },
  fulfilled: { label: "Fulfilled", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Truck },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shortId = (id: string) => id.slice(0, 8).toUpperCase();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-32 text-slate-500">
        <p>Failed to load dashboard data.</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: data.totalProducts.toLocaleString("en-IN"),
      icon: Package,
      iconColor: "text-violet-400",
      bgGradient: "from-violet-600/10 to-violet-600/5",
      borderColor: "border-violet-500/20",
    },
    {
      title: "Pending Orders",
      value: data.pendingOrders.toLocaleString("en-IN"),
      icon: Clock,
      iconColor: "text-amber-400",
      bgGradient: "from-amber-600/10 to-amber-600/5",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Low Stock Items",
      value: data.lowStockCount.toLocaleString("en-IN"),
      icon: AlertTriangle,
      iconColor: "text-red-400",
      bgGradient: "from-red-600/10 to-red-600/5",
      borderColor: "border-red-500/20",
    },
    {
      title: "Total Revenue",
      value: formatINR(data.totalRevenue),
      icon: IndianRupee,
      iconColor: "text-emerald-400",
      bgGradient: "from-emerald-600/10 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400">Overview of your B2B inventory and order operations.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.bgGradient} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{card.title}</p>
                <p className="text-2xl font-bold text-white mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-900/50 ${card.iconColor}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            {/* Decorative gradient orb */}
            <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full ${card.iconColor} opacity-5 blur-2xl`} />
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          </div>
          <span className="text-xs text-slate-500">Last 10 orders</span>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No orders yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/30">
              <tr className="text-slate-400 text-xs border-b border-slate-800">
                <th className="text-left px-6 py-3 font-medium">Order ID</th>
                <th className="text-left px-6 py-3 font-medium">Seller</th>
                <th className="text-left px-6 py-3 font-medium">Date</th>
                <th className="text-right px-6 py-3 font-medium">Total</th>
                <th className="text-center px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {data.recentOrders.map((order) => {
                const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConf.icon;

                return (
                  <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-bold text-violet-400">
                      {shortId(order.id)}
                    </td>
                    <td className="px-6 py-3 font-medium text-white">{order.sellerName}</td>
                    <td className="px-6 py-3 text-xs text-slate-400">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-3 text-right font-semibold text-white">
                      {formatINR(Number(order.totalAmount))}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusConf.color}`}>
                        <StatusIcon className="h-3 w-3" />
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
    </div>
  );
}
