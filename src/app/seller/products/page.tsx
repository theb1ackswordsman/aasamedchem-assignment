"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Filter, 
  Loader2, 
  ShoppingCart,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getUnitsForDimension, convertToBase, formatINR, Dimension, Unit } from "@/lib/units";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  dimension: string;
  baseUnit: string;
  basePrice: string;
  stockQuantity: string;
  minOrderQuantity: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function SellerBrowsePage() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Track cart item IDs for UI feedback (showing checkmark if added)
  const [cartItemIds, setCartItemIds] = useState<string[]>([]);

  // Sync added items from localStorage on mount
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItemIds(cart.map((item: any) => item.productId));
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pUrl = `/api/products?search=${encodeURIComponent(searchQuery)}` + 
                   (dimensionFilter !== "all" ? `&dimension=${dimensionFilter}` : "");
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(pUrl),
        fetch("/api/categories")
      ]);

      if (productsRes.ok && categoriesRes.ok) {
        let pData: Product[] = await productsRes.json();
        const cData = await categoriesRes.json();
        
        // Filter by category client-side if selected
        if (categoryFilter !== "all") {
          pData = pData.filter(p => p.categoryId === categoryFilter);
        }
        
        // Only show active products to sellers
        setProductsList(pData.filter(p => p.isActive));
        setCategoriesList(cData);
      }
    } catch (err) {
      console.error("Error loading browse products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, dimensionFilter, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToQuote = (product: Product) => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const alreadyInCart = existingCart.some((item: any) => item.productId === product.id);

    if (alreadyInCart) {
      return; // Already added
    }

    const newItem = {
      productId: product.id,
      name: product.name,
      dimension: product.dimension,
      base_unit: product.baseUnit,
      base_price: Number(product.basePrice),
      stock_quantity: Number(product.stockQuantity)
    };

    const newCart = [...existingCart, newItem];
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCartItemIds(newCart.map((item: any) => item.productId));
    
    // Dispatch custom event to update layouts
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Browse Products</h1>
        <p className="text-slate-400">Search products, inspect price conversions, and build your quotation request.</p>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={dimensionFilter} onValueChange={(val) => setDimensionFilter(val || "all")}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
              <SelectValue placeholder="All Dimensions" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem value="all">All Dimensions</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="count">Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem value="all">All Categories</SelectItem>
              {categoriesList.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading product catalog...</p>
        </div>
      ) : productsList.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          No products found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsList.map((product) => {
            const isAdded = cartItemIds.includes(product.id);
            const validUnits = getUnitsForDimension(product.dimension as Dimension);

            return (
              <Card key={product.id} className="border-slate-800 bg-slate-900/30 backdrop-blur-sm text-white flex flex-col justify-between hover:border-slate-700 transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      {product.sku}
                    </span>
                    {product.categoryName && (
                      <span className="text-xs text-violet-400 font-semibold">
                        {product.categoryName}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold text-white mt-2 leading-snug">{product.name}</CardTitle>
                  <CardDescription className="text-slate-400 text-xs mt-1 line-clamp-2">
                    {product.description || "No description available."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-between">
                  <div className="border-t border-slate-800/80 pt-4 mt-2">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Standard Pricing</p>
                    <div className="mt-1.5 space-y-1">
                      {validUnits.map((unit: Unit) => {
                        const price = convertToBase(1, unit) * Number(product.basePrice);
                        return (
                          <div key={unit} className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Price per {unit === "unit" ? "item" : unit}</span>
                            <span className="font-semibold text-white">{formatINR(price)}/{unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/45">
                    <span>Available Stock: {Number(product.stockQuantity).toLocaleString("en-IN")} {product.baseUnit}</span>
                    <span>Min Order: {Number(product.minOrderQuantity).toLocaleString("en-IN")} {product.baseUnit}</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-800/80">
                  <Button
                    onClick={() => handleAddToQuote(product)}
                    disabled={isAdded}
                    className={`w-full font-semibold transition-all duration-200 ${
                      isAdded 
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/20" 
                        : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Added to Quote
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Add to Quote
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
