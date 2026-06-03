"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
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
    <div className="space-y-8 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-medium text-gray-900">Inventory</h1>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="px-3 py-1.5 bg-amber-100 text-amber-800 text-[11px] font-medium uppercase tracking-wider rounded-md border border-amber-200 select-none">
              {lowStockCount} low stock item{lowStockCount > 1 ? "s" : ""}
            </div>
          )}
          <Button
            onClick={fetchProducts}
            variant="outline"
            className="h-9 px-4 text-[13px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md shadow-none"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white text-left">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-gray-500 text-sm">Loading inventory...</p>
          </div>
        ) : productsList.length === 0 ? (
          <div className="py-20 text-center text-gray-500 text-[13px] bg-white">
            <p>No products in inventory.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white border-b border-gray-200 text-gray-500 text-[11px] font-medium uppercase tracking-widest">
              <TableRow className="border-b border-gray-200 hover:bg-white">
                <TableHead className="font-medium">NAME</TableHead>
                <TableHead className="font-medium">SKU</TableHead>
                <TableHead className="font-medium">DIMENSION</TableHead>
                <TableHead className="font-medium">BASE UNIT</TableHead>
                <TableHead className="font-medium text-right">STOCK</TableHead>
                <TableHead className="font-medium text-right">MIN ORDER</TableHead>
                <TableHead className="font-medium text-center">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[13px] text-gray-700">
              {productsList.map((product, idx) => {
                const low = isLowStock(product);
                const stock = Number(product.stockQuantity);
                const minOrder = Number(product.minOrderQuantity);

                return (
                  <TableRow
                    key={product.id}
                    className={`h-11 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 ${
                      low
                        ? "border-l-2 border-l-amber-400 bg-amber-50/30 hover:bg-amber-50/40"
                        : idx % 2 === 0
                        ? "bg-white"
                        : "bg-[#F8FAFC]"
                    }`}
                  >
                    <TableCell className="px-6 py-2 text-gray-950 font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="px-6 py-2 font-mono text-[13px] text-gray-900">
                      {product.sku}
                    </TableCell>
                    <TableCell className="px-6 py-2 capitalize text-gray-500">
                      {product.dimension}
                    </TableCell>
                    <TableCell className="px-6 py-2 font-mono text-xs text-gray-500">
                      {product.baseUnit}
                    </TableCell>
                    <TableCell className="px-6 py-2 text-right font-medium tabular-nums">
                      <span className={low ? "text-red-600" : "text-gray-700"}>
                        {stock.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-2 text-right tabular-nums text-gray-500">
                      {minOrder.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="px-6 py-2 text-center">
                      {product.isActive ? (
                        <span className="bg-green-100 text-green-800 text-[11px] px-2 py-0.5 rounded-full font-medium">
                          active
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full font-medium">
                          inactive
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
