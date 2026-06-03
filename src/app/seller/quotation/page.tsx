"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  FileCheck,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { getUnitsForDimension, calculatePrice, formatINR, Dimension, Unit } from "@/lib/units";

interface CartItem {
  productId: string;
  name: string;
  dimension: string;
  base_unit: string;
  base_price: number;
  stock_quantity: number;
  // Local state extensions
  quantity?: number;
  unit?: Unit;
}

export default function QuotationBuilderPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load cart items on mount
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    // Hydrate each item with default quantity (1) and default unit (base_unit)
    const hydratedCart = storedCart.map((item: CartItem) => ({
      ...item,
      quantity: item.quantity || 1,
      unit: item.unit || (item.base_unit as Unit)
    }));
    setCart(hydratedCart);
  }, []);

  // Update localStorage helper
  const saveCartToStorage = (updatedCart: CartItem[]) => {
    // Strip state extensions before saving to localStorage to keep it clean
    const cleanCart = updatedCart.map(({ productId, name, dimension, base_unit, base_price, stock_quantity }) => ({
      productId,
      name,
      dimension,
      base_unit,
      base_price,
      stock_quantity
    }));
    localStorage.setItem("cart", JSON.stringify(cleanCart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string) => {
    const updated = cart.filter((item) => item.productId !== productId);
    setCart(updated);
    saveCartToStorage(updated);
  };

  // Update quantity handler
  const handleQuantityChange = (productId: string, valStr: string) => {
    const qty = parseFloat(valStr);
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: isNaN(qty) ? 0 : qty };
      }
      return item;
    });
    setCart(updated);
  };

  // Update unit handler
  const handleUnitChange = (productId: string, unit: Unit) => {
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, unit };
      }
      return item;
    });
    setCart(updated);
  };

  // Calculate live Grand Total
  const grandTotal = React.useMemo(() => {
    return cart.reduce((sum, item) => {
      const qty = item.quantity || 0;
      const unit = item.unit || (item.base_unit as Unit);
      const lineTotal = calculatePrice(qty, unit, item.base_price);
      return sum + lineTotal;
    }, 0);
  }, [cart]);

  // Submit order request
  const handleSubmitQuotation = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    // Validate quantities
    for (const item of cart) {
      if (!item.quantity || item.quantity <= 0) {
        setErrorMessage(`Please enter a valid quantity for ${item.name}`);
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      notes: orderNotes.trim(),
      items: cart.map((item) => ({
        productId: item.productId,
        orderedQuantity: item.quantity,
        orderedUnit: item.unit
      }))
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Clear quotation cart from storage and state
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cart-updated"));
        setCart([]);
        
        // Redirect to orders history
        router.push("/seller/orders");
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "Failed to submit quotation order.");
      }
    } catch (err) {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/seller/products")}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Quotation Builder</h1>
        <p className="text-slate-400">Specify quantities and target units to review instant line estimations.</p>
      </div>

      {cart.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-sm text-center py-16 text-slate-500">
          <CardContent className="space-y-4">
            <Calculator className="h-12 w-12 mx-auto text-slate-700" />
            <p className="text-slate-400 text-lg">Your quotation sheet is currently empty.</p>
            <Button 
              onClick={() => router.push("/seller/products")}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              Browse Catalog
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main items panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-sm text-white overflow-hidden shadow-xl">
              <CardHeader className="border-b border-slate-800 bg-slate-900/50">
                <CardTitle className="text-lg">Items Selection</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Verify your quantities and unit targets.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="border-b border-slate-800 text-slate-400">
                    <TableRow className="border-b border-slate-800 hover:bg-slate-900/20">
                      <TableHead>Item Details</TableHead>
                      <TableHead className="w-[120px]">Quantity</TableHead>
                      <TableHead className="w-[110px]">Unit</TableHead>
                      <TableHead className="text-right">Line Estimate</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-slate-300">
                    {cart.map((item) => {
                      const units = getUnitsForDimension(item.dimension as Dimension);
                      const currentQty = item.quantity || 0;
                      const currentUnit = item.unit || (item.base_unit as Unit);
                      const lineTotal = calculatePrice(currentQty, currentUnit, item.base_price);

                      return (
                        <TableRow key={item.productId} className="border-b border-slate-800 hover:bg-slate-900/20 transition-colors">
                          <TableCell className="align-middle">
                            <p className="font-semibold text-white">{item.name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">Base: {item.base_unit} @ {formatINR(item.base_price)}</span>
                          </TableCell>
                          <TableCell className="align-middle">
                            <Input
                              type="number"
                              min="0.0001"
                              step="any"
                              value={item.quantity === 0 ? "" : item.quantity}
                              onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                              className="bg-slate-950 border-slate-800 text-white focus:border-violet-500 font-medium text-sm h-9"
                            />
                          </TableCell>
                          <TableCell className="align-middle">
                            <Select 
                              value={currentUnit} 
                              onValueChange={(val) => handleUnitChange(item.productId, val as Unit)}
                            >
                              <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                {units.map((u) => (
                                  <SelectItem key={u} value={u}>
                                    {u}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-bold text-white align-middle">
                            {formatINR(lineTotal)}
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-slate-850"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right summary card */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-sm text-white shadow-xl">
              <CardHeader className="border-b border-slate-800 bg-slate-900/50">
                <CardTitle className="text-lg">Quotation Summary</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-6">
                {errorMessage && (
                  <div className="rounded-lg bg-red-950/50 p-3 text-sm text-red-400 border border-red-800/50 font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 text-sm">Total items selection</span>
                  <span className="font-semibold text-white">{cart.length}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400 text-sm font-medium">Grand Total</span>
                  <span className="text-2xl font-black text-white bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    {formatINR(grandTotal)}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="orderNotes" className="text-slate-400 text-xs">Quotation Notes (Optional)</Label>
                  <textarea
                    id="orderNotes"
                    rows={3}
                    placeholder="Enter special chemical handling or delivery instructions..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  onClick={handleSubmitQuotation}
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-6 transition-all duration-200 shadow-lg shadow-violet-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <FileCheck className="mr-2 h-5 w-5" /> Submit Quotation Request
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
