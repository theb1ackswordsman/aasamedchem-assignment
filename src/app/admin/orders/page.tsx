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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "pending", color: "bg-amber-100 text-amber-800" },
  confirmed: { label: "confirmed", color: "bg-blue-100 text-blue-800" },
  fulfilled: { label: "fulfilled", color: "bg-green-100 text-green-800" },
  cancelled: { label: "cancelled", color: "bg-gray-100 text-gray-600" },
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
    });
  };

  const shortId = (id: string) => id.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-8 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-medium text-gray-900">Orders</h1>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          className="h-9 px-4 text-[13px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md shadow-none"
        >
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white text-left">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-gray-500 text-sm">Loading orders...</p>
          </div>
        ) : ordersList.length === 0 ? (
          <div className="py-20 text-center text-gray-500 text-[13px] bg-white">
            <p>No orders found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white border-b border-gray-200 text-gray-500 text-[11px] font-medium uppercase tracking-widest">
              <TableRow className="border-b border-gray-200 hover:bg-white">
                <TableHead className="font-medium">ORDER ID</TableHead>
                <TableHead className="font-medium">SELLER</TableHead>
                <TableHead className="font-medium">DATE</TableHead>
                <TableHead className="font-medium text-center">ITEMS</TableHead>
                <TableHead className="font-medium text-right">TOTAL</TableHead>
                <TableHead className="font-medium text-center">STATUS</TableHead>
                <TableHead className="font-medium text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[13px] text-gray-700">
              {ordersList.map((order, idx) => {
                const isExpanded = expandedOrderId === order.id;
                const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const nextStatuses = VALID_TRANSITIONS[order.status] || [];

                return (
                  <React.Fragment key={order.id}>
                    {/* Main order row */}
                    <TableRow 
                      className={`h-11 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"
                      }`}
                    >
                      <td className="px-6 py-2">
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="font-mono text-[13px] font-medium text-blue-600 hover:underline"
                        >
                          {shortId(order.id)}
                        </button>
                      </td>
                      <td className="px-6 py-2">
                        <div>
                          <p className="font-medium text-gray-950">{order.sellerName}</p>
                          <p className="text-[11px] text-gray-400 leading-none">{order.sellerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-2 text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-2 text-center text-gray-500 font-medium">
                        {order.items.length}
                      </td>
                      <td className="px-6 py-2 text-right font-medium tabular-nums text-gray-900">
                        {formatINR(Number(order.totalAmount))}
                      </td>
                      <td className="px-6 py-2 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-right">
                        {nextStatuses.length > 0 ? (
                          <Select
                            onValueChange={(val) => handleStatusChange(order.id, val as string)}
                            disabled={updatingOrderId === order.id}
                          >
                            <SelectTrigger className="w-32 h-8 border border-gray-200 text-[12px] bg-white rounded-md shadow-none px-2 inline-flex focus:ring-blue-500">
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200">
                              {nextStatuses.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize text-[12px]">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-[12px] text-gray-400">—</span>
                        )}
                      </td>
                    </TableRow>

                    {/* Expandable line items row */}
                    {isExpanded && (
                      <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                        <TableCell colSpan={7} className="p-0">
                          <div className="px-8 py-4 bg-gray-50 text-left">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
                              LINE ITEMS
                            </p>
                            {order.notes && (
                              <div className="mb-4 p-3 rounded border border-gray-200 bg-white text-[13px] text-gray-600">
                                <span className="font-medium text-gray-900">Notes:</span> {order.notes}
                              </div>
                            )}
                            <table className="w-full text-left text-[12px] border-collapse bg-transparent">
                              <thead>
                                <tr className="text-gray-500 border-b border-gray-200 text-[11px] font-medium uppercase tracking-widest">
                                  <th className="pb-2 font-medium">PRODUCT</th>
                                  <th className="pb-2 font-medium text-right">ORDERED QTY</th>
                                  <th className="pb-2 font-medium text-right">BASE QTY</th>
                                  <th className="pb-2 font-medium text-right">UNIT PRICE</th>
                                  <th className="pb-2 font-medium text-right">LINE TOTAL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-gray-700 bg-transparent">
                                {order.items.map((item) => (
                                  <tr key={item.id} className="h-9 bg-transparent">
                                    <td className="py-2 text-gray-950 font-medium bg-transparent">
                                      {item.productName} <span className="font-mono text-[10px] text-gray-400">({item.productSku})</span>
                                    </td>
                                    <td className="py-2 text-right tabular-nums bg-transparent">
                                      {Number(item.orderedQuantity).toLocaleString("en-IN")} {item.orderedUnit}
                                    </td>
                                    <td className="py-2 text-right tabular-nums bg-transparent">
                                      {Number(item.quantityInBaseUnit).toLocaleString("en-IN")} {item.productBaseUnit}
                                    </td>
                                    <td className="py-2 text-right tabular-nums bg-transparent">
                                      {formatINR(Number(item.unitPriceSnapshot))}/{item.productBaseUnit}
                                    </td>
                                    <td className="py-2 text-right font-medium tabular-nums text-gray-900 bg-transparent">
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
