"use client";

import { useSession } from "next-auth/react";

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400">Welcome to the B2B order and inventory dashboard.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Active Seller Accounts</p>
          <p className="text-2xl font-bold text-white mt-2">--</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Total Products</p>
          <p className="text-2xl font-bold text-white mt-2">--</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Total Stock Value</p>
          <p className="text-2xl font-bold text-white mt-2">--</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium text-slate-400">Pending Orders</p>
          <p className="text-2xl font-bold text-white mt-2">--</p>
        </div>
      </div>
    </div>
  );
}
