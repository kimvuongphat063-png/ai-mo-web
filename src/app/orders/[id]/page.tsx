"use client";
import { use, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { demoOrders, money, Order } from "@/lib/store";

function loadOrder(id: string): Order | undefined {
  if (typeof window === "undefined") return demoOrders.find((order) => order.id === id);
  const raw = localStorage.getItem(`pixel-order-${id}`);
  return raw ? (JSON.parse(raw) as Order) : demoOrders.find((order) => order.id === id);
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order] = useState(() => loadOrder(id));
  if (!order)
    return (
      <main className="page-main container narrow">
        <div className="empty">
          <h1>Order not found</h1>
          <Link href="/account/orders">View demo orders</Link>
        </div>
      </main>
    );
  return (
    <main className="page-main container narrow">
      <div className="page-title">
        <span className="status">{order.status}</span>
        <h1>Order {order.id}</h1>
        <p>{order.date} · {order.email}</p>
      </div>
      <section className="order-card">
        {order.items.map((entry, index) => (
          <div className="download-row" key={`${entry.product.id}-${index}`}>
            <div>
              <h2>{entry.product.name}</h2>
              <p>{entry.license} license</p>
            </div>
            <button
              className="btn btn-dark"
              onClick={() =>
                alert("Demo download started. Production will return a signed, expiring file URL.")
              }
            >
              <Download /> Download
            </button>
          </div>
        ))}
        <div className="total">
          <span>Total paid</span><b>{money(order.total)}</b>
        </div>
      </section>
    </main>
  );
}
