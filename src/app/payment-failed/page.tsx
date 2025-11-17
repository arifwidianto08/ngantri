"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    id: string;
    status: string;
    total_amount: number;
  } | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.push("/orders");
      return;
    }

    // Get order details
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data.data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const handleRetryPayment = async () => {
    if (!orderId) return;

    setIsCreatingPayment(true);
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Xendit payment page
        window.location.href = data.data.order.payment_url;
      } else {
        const error = await response.json();
        alert(error.error?.message || "Gagal membuat link pembayaran");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Gagal membuat link pembayaran. Silakan coba lagi.");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-20">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Failed</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Pembayaran Gagal</h1>
          <p className="mt-2 text-gray-600">
            Pembayaran Anda tidak dapat diproses
          </p>
        </div>
        <div className="space-y-6 p-6">
          {orderDetails && (
            <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Pesanan</span>
                <span className="font-mono font-medium">
                  #{orderDetails.id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium capitalize text-orange-600">
                  {orderDetails.status === "pending"
                    ? "Menunggu Pembayaran"
                    : orderDetails.status}
                </span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="font-medium">Total Pembayaran</span>
                <span className="text-lg font-bold">
                  Rp {orderDetails.total_amount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <title>Error</title>
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-medium text-red-900">
                  Kenapa pembayaran gagal?
                </h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-800">
                  <li>Waktu pembayaran telah habis</li>
                  <li>Pembayaran dibatalkan</li>
                  <li>Saldo tidak mencukupi</li>
                  <li>Masalah koneksi dengan payment gateway</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
            <p className="font-medium text-blue-900">
              Apa yang bisa dilakukan?
            </p>
            <ul className="list-inside list-disc space-y-1 text-blue-800">
              <li>Coba bayar lagi dengan metode yang sama atau berbeda</li>
              <li>Pastikan saldo Anda mencukupi</li>
              <li>Hubungi customer service jika masalah berlanjut</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={handleRetryPayment}
              disabled={isCreatingPayment || !orderId}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingPayment ? (
                <>
                  <svg
                    className="mr-2 inline h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <title>Loading</title>
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 inline h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Retry</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Coba Bayar Lagi
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="flex-1 rounded-lg border bg-white px-4 py-2 font-medium hover:bg-gray-50"
            >
              <svg
                className="mr-2 inline h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Back</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Lihat Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
