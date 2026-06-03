"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/units";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productBaseUnit: string;
  orderedQuantity: string;
  orderedUnit: string;
  quantityInBaseUnit: string;
  unitPriceSnapshot: string;
  lineTotal: string;
}

interface Order {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: CheckCircle2 },
  fulfilled: { label: "Fulfilled", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Truck },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
};

export default function AdminOrdersPage() {
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrdersList(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status.");
      }
    } catch (err) {
      alert("An error occurred while updating status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Orders Management</h1>
          <p className="text-slate-400">Review, approve, or update orders placed by sellers.</p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="ghost"
          className="text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            <p className="text-slate-400 text-sm">Loading orders...</p>
          </div>
        ) : ordersList.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-slate-700" />
            <p>No orders found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-900/50 border-b border-slate-800 text-slate-300">
              <TableRow className="border-b border-slate-800 hover:bg-slate-900/30">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="font-semibold">Order ID</TableHead>
                <TableHead className="font-semibold">Seller</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-center">Items</TableHead>
                <TableHead className="font-semibold text-right">Total (INR)</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-slate-300">
              {ordersList.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConf.icon;
                const nextStatuses = VALID_TRANSITIONS[order.status] || [];

                return (
                  <React.Fragment key={order.id}>
                    {/* Main order row */}
                    <TableRow className="border-b border-slate-800 hover:bg-slate-900/30 transition-colors">
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-white"
                          onClick={() => toggleExpand(order.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-violet-400">
                        {shortId(order.id)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white text-sm">{order.sellerName}</p>
                          <p className="text-[11px] text-slate-500">{order.sellerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          {order.items.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-white">
                        {formatINR(Number(order.totalAmount))}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConf.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConf.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {nextStatuses.length > 0 ? (
                          <Select
                            onValueChange={(val) => handleStatusChange(order.id, val as string)}
                            disabled={updatingOrderId === order.id}
                          >
                            <SelectTrigger className="w-[140px] h-8 bg-slate-950 border-slate-800 text-white text-xs mx-auto">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                              {nextStatuses.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize">
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-slate-600">No actions</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expandable line items row */}
                    {isExpanded && (
                      <TableRow className="bg-slate-950/50 border-b border-slate-800">
                        <TableCell colSpan={8} className="p-0">
                          <div className="px-6 py-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                              Line Items
                            </p>
                            {order.notes && (
                              <div className="mb-3 p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400">
                                <span className="font-semibold text-slate-300">Notes:</span> {order.notes}
                              </div>
                            )}
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-slate-500 text-xs border-b border-slate-800">
                                  <th className="text-left pb-2 font-medium">Product</th>
                                  <th className="text-left pb-2 font-medium">SKU</th>
                                  <th className="text-right pb-2 font-medium">Ordered Qty</th>
                                  <th className="text-right pb-2 font-medium">Base Qty</th>
                                  <th className="text-right pb-2 font-medium">Unit Price</th>
                                  <th className="text-right pb-2 font-medium">Line Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item) => (
                                  <tr key={item.id} className="border-b border-slate-800/50 text-slate-300">
                                    <td className="py-2 font-medium text-white">{item.productName}</td>
                                    <td className="py-2 font-mono text-xs text-violet-400">{item.productSku}</td>
                                    <td className="py-2 text-right">
                                      {Number(item.orderedQuantity).toLocaleString("en-IN")} {item.orderedUnit}
                                    </td>
                                    <td className="py-2 text-right">
                                      {Number(item.quantityInBaseUnit).toLocaleString("en-IN")} {item.productBaseUnit}
                                    </td>
                                    <td className="py-2 text-right">
                                      {formatINR(Number(item.unitPriceSnapshot))}/{item.productBaseUnit}
                                    </td>
                                    <td className="py-2 text-right font-semibold text-white">
                                      {formatINR(Number(item.lineTotal))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
