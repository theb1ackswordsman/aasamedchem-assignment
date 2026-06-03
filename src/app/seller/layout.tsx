"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  Search, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  User,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    { name: "Browse Products", href: "/seller/products", icon: Search },
    { name: "Build Quotation", href: "/seller/quotation", icon: FileText, hasBadge: true },
    { name: "My Quotations", href: "/seller/orders", icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-tr from-violet-600 to-blue-600 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-wider text-white">AASAMEDCHEM</span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? "bg-slate-800 text-white border-b-2 border-violet-500 rounded-b-none" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                    {item.hasBadge && cartCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-bold rounded-full bg-violet-600 text-white animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Panel (User + Logout) */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs max-w-[200px]">
              <User className="h-4 w-4 text-violet-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="font-semibold truncate">{session?.user?.name || "Seller"}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-slate-700"
            >
              <LogOut className="mr-2 h-4 w-4 text-red-400" />
              Sign Out
            </Button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          <div className="relative flex flex-col flex-1 w-full max-w-xs bg-slate-900 border-r border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg tracking-wider text-white">AASAMEDCHEM</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="p-2 bg-slate-800 rounded-full">
                <User className="h-5 w-5 text-violet-400" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold truncate">{session?.user?.name || "Seller"}</p>
                <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
              </div>
            </div>

            {/* Links */}
            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-violet-600 text-white" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.hasBadge && cartCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-bold rounded-full bg-violet-600 text-white animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-950 p-6 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
