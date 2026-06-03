"use client";

import { useSession } from "next-auth/react";

export default function SellerBrowsePage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Browse Products</h1>
        <p className="text-slate-400">Explore catalog and draft quotations/orders.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
        Product catalog listing is coming soon.
      </div>
    </div>
  );
}
