# Overview

**Ngantri** adalah aplikasi web pemesanan makanan di area food court.

Aplikasi ini mendukung tiga peran utama:
- **Customer (Pembeli)**
- **Merchant (Penjual)**
- **Admin (Pengelola Sistem)**

## Status Pesanan

| Status | Deskripsi |
|------|----------|
| pending | Pesanan dibuat |
| accepted | Pesanan diterima merchant |
| preparing | Pesanan sedang disiapkan |
| ready | Pesanan siap diambil |
| completed | Pesanan selesai |
| cancelled | Pesanan dibatalkan |

**Catatan Pembayaran**  
Customer melakukan pembayaran **langsung di counter merchant**.

## URL Penting (Local Development)

- Customer: `http://localhost:3000`
- Customer Orders: `http://localhost:3000/orders`
- Merchant Login: `http://localhost:3000/dashboard/login`
- Merchant Dashboard: `http://localhost:3000/dashboard`
- Admin Login: `http://localhost:3000/admin/login`
- Admin Dashboard: `http://localhost:3000/admin`
