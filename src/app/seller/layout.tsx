"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    };
    updateCount();
    window.addEventListener("cart-updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("cart-updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  const navigation = [
    { name: "Browse Products", href: "/seller/products", hasBadge: true },
    { name: "Build Quotation", href: "/seller/quotation" },
    { name: "My Quotations", href: "/seller/orders" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[220px] bg-[#0F172A] flex flex-col justify-between shrink-0 border-r border-[#E5E7EB]/10 z-30">
        <div className="flex flex-col flex-1">
          {/* Header */}
          <div className="p-6">
            <h2 className="text-white text-[14px] font-medium leading-none">Inventory Manager</h2>
            <p className="text-[11px] text-gray-400 mt-1.5 leading-none">Pharma B2B Portal</p>
          </div>

          {/* Links */}
          <nav className="flex-1 mt-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <div
                  key={item.name}
                  className={`flex items-center justify-between px-6 py-2.5 font-medium transition-colors ${
                    isActive 
                      ? "text-white bg-white/5 border-l-2 border-blue-500" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Link href={item.href} className="text-[13px] flex-1">
                    {item.name}
                  </Link>
                  {item.hasBadge && cartCount > 0 && (
                    <Link 
                      href="/seller/quotation" 
                      className="ml-2 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-blue-500 text-white select-none hover:bg-blue-600 transition-colors"
                      title="View Quotation Builder"
                    >
                      {cartCount}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Info & Logout */}
        <div className="p-6 border-t border-white/5 space-y-4">
          <div className="text-gray-400 text-xs truncate">
            <p className="font-medium text-white">{session?.user?.name || "Seller"}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{(session?.user as any)?.role || "Seller Partner"}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[13px] text-gray-400 hover:text-white block text-left font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pl-[220px] bg-white min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
