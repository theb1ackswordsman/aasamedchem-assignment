"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Boxes,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  name: string;
  sku: string;
  dimension: string;
  baseUnit: string;
  stockQuantity: string;
  minOrderQuantity: string;
  isActive: boolean;
}

export default function AdminInventoryPage() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProductsList(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const isLowStock = (product: Product) => {
    const stock = Number(product.stockQuantity);
    const minOrder = Number(product.minOrderQuantity);
    return stock < minOrder * 5;
  };

  const lowStockCount = productsList.filter(isLowStock).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Inventory Management</h1>
          <p className="text-slate-400">Track stock levels across all products.</p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              {lowStockCount} low stock item{lowStockCount > 1 ? "s" : ""}
            </div>
          )}
          <Button
            onClick={fetchProducts}
            variant="ghost"
            className="text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            <p className="text-slate-400 text-sm">Loading inventory...</p>
          </div>
        ) : productsList.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Boxes className="h-12 w-12 mx-auto mb-4 text-slate-700" />
            <p>No products in inventory.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-900/50 border-b border-slate-800 text-slate-300">
              <TableRow className="border-b border-slate-800 hover:bg-slate-900/30">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Dimension</TableHead>
                <TableHead className="font-semibold text-right">Stock (Base Unit)</TableHead>
                <TableHead className="font-semibold text-right">Min Order</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-slate-300">
              {productsList.map((product) => {
                const low = isLowStock(product);
                const stock = Number(product.stockQuantity);
                const minOrder = Number(product.minOrderQuantity);

                return (
                  <TableRow
                    key={product.id}
                    className={`border-b border-slate-800 transition-colors ${
                      low
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : "hover:bg-slate-900/30"
                    }`}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        {low && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-violet-400">
                      {product.sku}
                    </TableCell>
                    <TableCell className="capitalize text-xs text-slate-400">
                      {product.dimension}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${low ? "text-amber-400" : stock === 0 ? "text-red-400" : "text-white"}`}>
                        {stock.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">{product.baseUnit}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-400">
                      {minOrder.toLocaleString("en-IN")} {product.baseUnit}
                    </TableCell>
                    <TableCell className="text-center">
                      {stock === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          Out of Stock
                        </span>
                      ) : low ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          In Stock
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
