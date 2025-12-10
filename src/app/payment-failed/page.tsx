"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

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
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-gray-900"
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
              <li>Lihat pesanan Anda dan coba bayar lagi</li>
              <li>Pastikan saldo Anda mencukupi</li>
              <li>Hubungi customer service jika masalah berlanjut</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                router.push(
                  sessionId ? `/orders?session_id=${sessionId}` : "/orders"
                )
              }
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
