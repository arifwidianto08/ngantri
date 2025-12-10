"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    // Small delay for better UX, then redirect to orders
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId, router]);

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
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-12 w-12 text-gray-900"
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
              onClick={() => router.push(`/orders?session_id=${sessionId}`)}
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
