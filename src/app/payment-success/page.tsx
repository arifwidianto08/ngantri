"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [isVerifying, setIsVerifying] = useState(true);
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

    // Verify payment status with backend
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data.data);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
      } finally {
        setIsVerifying(false);
      }
    };

    // Small delay to ensure webhook has been processed
    const timer = setTimeout(verifyPayment, 2000);
    return () => clearTimeout(timer);
  }, [orderId, router]);

  if (isVerifying) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-gray-600">Memverifikasi pembayaran...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-20">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-12 w-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Success</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Pembayaran Berhasil!</h1>
          <p className="mt-2 text-gray-600">
            Terima kasih, pembayaran Anda telah kami terima
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
                <span className="font-medium capitalize text-green-600">
                  {orderDetails.status === "accepted"
                    ? "Diterima"
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

          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
            <p className="font-medium text-blue-900">Langkah Selanjutnya:</p>
            <ul className="list-inside list-disc space-y-1 text-blue-800">
              <li>Merchant akan memproses pesanan Anda</li>
              <li>Anda akan menerima notifikasi WhatsApp saat pesanan siap</li>
              <li>Silakan tunjukkan ID pesanan saat mengambil</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Lihat Pesanan Saya
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 rounded-lg border bg-white px-4 py-2 font-medium hover:bg-gray-50"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
