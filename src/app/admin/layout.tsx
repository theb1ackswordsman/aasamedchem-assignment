"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ShoppingCart, 
  LogOut, 
  Menu, 
  X,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Inventory", href: "/admin/inventory", icon: Boxes },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 md:hidden w-full">
        <span className="font-bold text-lg tracking-wider text-white">AASAMEDCHEM</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Navigation Drawer */}
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
                <p className="text-sm font-semibold truncate">{session?.user?.name || "Admin"}</p>
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
                    {item.name}
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

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 border-r border-slate-800 min-h-screen p-6 space-y-6 shrink-0">
        <div>
          <span className="font-bold text-xl tracking-wider text-white block text-center py-2">
            AASAMEDCHEM
          </span>
          <span className="text-[10px] bg-violet-600/20 text-violet-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider block w-max mx-auto mt-1 border border-violet-500/20">
            Admin Portal
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div className="p-2 bg-slate-800 rounded-full shrink-0">
            <User className="h-5 w-5 text-violet-400" />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold truncate">{session?.user?.name || "Admin"}</p>
            <p className="text-xs text-slate-400 truncate text-left">{session?.user?.email}</p>
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
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/10" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start text-slate-400 hover:bg-slate-800/50 hover:text-white border border-slate-800/50 hover:border-slate-700"
        >
          <LogOut className="mr-3 h-5 w-5 text-red-400" />
          Sign Out
        </Button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen bg-slate-950 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
