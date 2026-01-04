# DRPL (Dokumen Rencana Pengujian Perangkat Lunak)
## Sistem: Ngantri — Food Court Ordering System

**Versi**: 1.0  
**Tanggal**: 4 Januari 2026

---

## 1. Pendahuluan

### 1.1 Tujuan Pembuatan Dokumen

Dokumen Rencana Pengujian Perangkat Lunak (DRPL) ini dibuat dengan tujuan untuk:

- Mendefinisikan strategi, pendekatan, dan cakupan pengujian sistem Ngantri
- Menjadi acuan pelaksanaan pengujian (apa yang diuji, bagaimana pendekatan pengujiannya, dan batasannya).
- Menjadi dasar penentuan kriteria keberhasilan pengujian.

---

### 1.2 Ruang Lingkup Pengujian

Ruang lingkup pengujian pada dokumen ini dibatasi pada pengujian fungsional aplikasi web Ngantri. Fitur yang diuji meliputi:

- Mengisi informasi nomor meja, nama customer dan nomor WhatsApp.
- Memperbarui informasi nomor meja, nama customer dan nomor WhatsApp.
- Keranjang belanja (tambah/hapus/ubah jumlah item)
- Checkout (input nama dan nomor WhatsApp) dan pembuatan order.
- Pelacakan status order (mis. submitted/accepted/preparing/ready/completed).
- Fitur merchant: login, pengelolaan profil, pengelolaan menu, dan pengelolaan pesanan.
- Endpoint API terkait merchant, menu, order, dan session.

---

### 1.3 Referensi

1. Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL)
	- Link: SKPL Ngantri
2. Source Code
	- Link: Github Ngantri

---

### 1.4 Overview Sistem & Fitur Utamanya

Ngantri adalah aplikasi web untuk pemesanan makanan di area food court. Buyer dapat memesan dari beberapa merchant dalam satu sesi (multi-merchant cart), melakukan checkout dengan identitas (nama dan nomor WhatsApp), lalu merchant memproses pesanan sampai selesai.

Fitur utama:

- Browse merchant & menu.
- Cart dan checkout (nama + WhatsApp).
- Pelacakan status order end-to-end.
- Dashboard merchant untuk manajemen menu dan order.
- Endpoint API untuk merchants, menus, orders, dan sessions.

---

### 1.5 Overview Pengujian

Pengujian dilakukan bertingkat untuk menutup risiko pada level logika bisnis, API, dan alur pengguna.

**Pendekatan pengujian yang digunakan di repository:**
- API integration test dengan Jest pada folder tests/api/.
- End-to-End (E2E) test dengan Playwright pada folder tests/e2e/.

**Perintah menjalankan pengujian (berdasarkan package.json):**
- npm test (Jest)
- npm run test:e2e (Playwright)

---

### 1.5.1 Perangkat Keras Pengujian

Perangkat keras yang digunakan untuk menguji software ini terdiri dari:

- Perangkat : Laptop
- Processor : Intel Core i5
- RAM : 16 GB
- Storage: Minimal 10 GB ruang kosong untuk dependency Node.js, cache, dan image Docker

---

### 1.5.2 Sumber Daya Manusia

Sumber daya manusia yang terlibat dalam pengujian perangkat lunak:

| No. | Nama Anggota | Peran |
|---:|---|---|
| 1. | M. Iqbal Maulana | |
| 2. | Arif Widianto | |
| 3. | Ahmad Farhan | |
| 4. | Gardha Dananjaya | |

---

### 1.5.3 Perangkat Lunak Pengujian

Perangkat lunak yang digunakan untuk pengujian:

- Runtime: Node.js 18+
- Package manager: npm
- Database: PostgreSQL
- Container: Docker & Docker Compose
- Browser: Chrome/Chromium

Framework pengujian:

- Jest (unit/API testing)
- Playwright (E2E testing)

---

### 1.5.4 Material Pengujian

Material pengujian menjelaskan modul-modul yang akan diuji pada sistem Ngantri. Modul yang diuji meliputi:

1. Customer
	- Akses halaman utama (Mengisi informasi nomor meja, nama customer dan nomor WhatsApp)
	- browsing merchant dan menu.
	- Keranjang belanja (cart) dan total belanja.
	- Checkout dan konfirmasi order.
	- Halaman riwayat/daftar order dan status order.
2. Merchant
	- Autentikasi merchant (login).
	- Dashboard merchant.
	- Manajemen menu (CRUD menu, status ketersediaan).
	- Manajemen pesanan (melihat order masuk, merubah status pesanan).
3. Admin
	- Melihat dan mengatur order status.
	- Manajemen Merchant (CRUD).

---

### 1.5.5 Strategi dan Metode Pengujian
Menjelaskan strategi dan metode pengujian yang akan digunakan.

---

### 1.5.6 Jadwal Pengujian

Tabel 1.2 Jadwal Pengujian

| Use Case | PIC | Jadwal pengujian |
|---|---|---|
| Akses halaman utama |  | 4 Januari 2026 |
| browsing merchant dan menu |  | 4 Januari 2026 |
| Menambah Pesanan pada keranjang belanja |  | 4 Januari 2026 |
| Checkout dan konfirmasi order |  | 4 Januari 2026 |
| Halaman riwayat/daftar order dan status order. |  | 4 Januari 2026 |
| Halaman riwayat/daftar order dan status order. |  | 4 Januari 2026 |
| Manajemen menu |  | 4 Januari 2026 |
| Manajemen pesanan |  | 4 Januari 2026 |
| Manajemen Merchant |  | 4 Januari 2026 |
| Melihat dan mengatur order status(admin) |  | 4 Januari 2026 |

---

## 2 Pelaksanaan Pengujian

(Uraiakan pengujian sesuai dengan butir uji yang sudah didefinisikan dalam rencana pengujian)

### 2.1 Pengujian UNIT

#### 2.1.1 Pengujian White Box Method

**a. Pilih method paling rumit dari class paling rumit**

Untuk pengujian white-box pada sistem Ngantri, proses **checkout** direpresentasikan oleh handler pembuatan order batch pada lapisan API, yaitu:

- **Unit yang diuji**: API Route Handler (Checkout batch)
- **Endpoint**: `POST /api/orders/batch`
- **Handler**: `createBatchOrdersHandler(request: NextRequest)`
- **Lokasi**: `src/app/api/orders/batch/route.ts`

Handler ini dipilih karena berada pada jalur kritikal checkout (pembuatan order untuk multi-merchant dalam satu transaksi) dan memuat validasi bisnis utama yang menentukan apakah checkout dapat diproses, khususnya validasi **ketersediaan merchant dan menu** (menghasilkan error `MERCHANT_INACTIVE`/`MENU_UNAVAILABLE`). Selain itu, handler ini melakukan operasi database dalam transaksi agar seluruh order bersifat atomik (seluruhnya berhasil atau seluruhnya gagal).

**Handler ini** melakukan proses checkout sebagai berikut:

1. Memvalidasi request body (`sessionId`, `customerName`, `customerPhone`, dan `ordersByMerchant`). Jika tidak lengkap atau tidak ada order yang diberikan, mengembalikan error `BAD_REQUEST`.
2. Memverifikasi `buyerSessions` untuk memastikan `sessionId` valid. Jika tidak ditemukan, mengembalikan error `NOT_FOUND`.
3. Membuka transaksi database untuk menjamin atomicity.
4. Memuat (preload) data merchant dan menu yang relevan sekali (tanpa query pada loop), lalu melakukan validasi:
	- Merchant harus ada dan tidak soft-deleted.
	- Merchant harus tersedia (`isAvailable = true`), jika tidak mengembalikan `MERCHANT_INACTIVE`.
	- Menu harus ada, milik merchant yang benar, tidak soft-deleted.
	- Menu harus tersedia (`isAvailable = true`), jika tidak mengembalikan `MENU_UNAVAILABLE`.
5. Jika validasi lolos, membuat order per-merchant (insert ke `orders`) dan membuat item order secara bulk (insert ke `order_items`).
6. Jika terjadi kegagalan dalam transaksi, seluruh perubahan dibatalkan dan handler mengembalikan error yang sesuai (`AppError` bisnis atau `INTERNAL_SERVER_ERROR`).

---

**b. Flowchart/Flowgraph**

Flowgraph checkout (handler `POST /api/orders/batch`) dengan memperhatikan tiga jalur utama: **kegagalan input/entitas**, **kegagalan ketersediaan menu/merchant**, dan **kegagalan transaksi database**.

```mermaid
flowchart TD
	A([Mulai]) --> B[Validasi request body]
	B --> C{Input lengkap?}
	C -- Tidak --> X[Return 400 BAD_REQUEST] --> Z([Selesai])
	C -- Ya --> D{ordersByMerchant kosong?}
	D -- Ya --> X2[Return 400 BAD_REQUEST] --> Z
	D -- Tidak --> E[Query buyerSessions by sessionId]
	E --> F{Session ditemukan?}
	F -- Tidak --> X3[Return 404 NOT_FOUND] --> Z
	F -- Ya --> G[Begin DB Transaction]
	G --> H[Preload merchants & menus (1x)]
	H --> I[Loop tiap merchant]
	I --> J{Items kosong?}
	J -- Ya --> V0[Throw VALIDATION_ERROR] --> CATCH
	J -- Tidak --> K{Merchant ada & aktif?}
	K -- Tidak --> V1[Throw MERCHANT_NOT_FOUND / MERCHANT_INACTIVE] --> CATCH
	K -- Ya --> L[Loop tiap item]
	L --> M{Menu ada & milik merchant?}
	M -- Tidak --> V2[Throw MENU_NOT_FOUND] --> CATCH
	M -- Ya --> N{Menu tersedia?}
	N -- Tidak --> V3[Throw MENU_UNAVAILABLE] --> CATCH
	N -- Ya --> O[Insert order]
	O --> P[Insert bulk order_items]
	P --> Q{Masih ada merchant?}
	Q -- Ya --> I
	Q -- Tidak --> R[Commit & return success] --> Z
	G --> CATCH[Catch]
	CATCH --> S{Error AppError?}
	S -- Ya --> T[Return error bisnis] --> Z
	S -- Tidak --> U[Return 500 INTERNAL_SERVER_ERROR] --> Z
```

---

**c. Hitung cyclomatic complexity**

Perhitungan Cyclomatic Complexity (menggunakan pendekatan **jumlah keputusan + 1**) untuk alur handler `POST /api/orders/batch`:

Keputusan (jalur alternatif) yang relevan pada checkout:

1. Input wajib lengkap atau tidak
2. `ordersByMerchant` kosong atau tidak
3. Session ditemukan atau tidak
4. Items per-merchant kosong atau tidak
5. Merchant ada atau tidak
6. Merchant tersedia atau tidak
7. Menu ada dan milik merchant yang benar atau tidak
8. Menu tersedia atau tidak
9. Error yang tertangkap termasuk `AppError` atau tidak

Jumlah keputusan = 9  
Maka Cyclomatic Complexity:

$$CC = 9 + 1 = 10$$

Artinya terdapat **10 jalur independen** secara teoritis. Pada laporan ini, basis path difokuskan pada jalur yang paling representatif terhadap risiko bisnis checkout.

---

**d. Daftar path yang perlu diuji (Basis Path)**

Berikut daftar basis path yang digunakan untuk pengujian white-box checkout (`POST /api/orders/batch`):

1. **P1 (Kegagalan ketersediaan menu/merchant)**: menu atau merchant tidak tersedia (`isAvailable = false`) → checkout ditolak dan mengembalikan `MENU_UNAVAILABLE` atau `MERCHANT_INACTIVE`.
2. **P2 (Sukses)**: seluruh validasi lolos → transaksi membuat order dan order items → mengembalikan respons sukses.
3. **P3 (Kegagalan transaksi/database)**: validasi lolos, namun terjadi kegagalan saat operasi insert dalam transaksi → transaksi dibatalkan → mengembalikan `INTERNAL_SERVER_ERROR`.

---

**e. Data uji untuk setiap path**

Karena ini pengujian white-box pada handler API, data uji disusun dengan **kombinasi manipulasi data ketersediaan** (untuk memicu error `MENU_UNAVAILABLE`/`MERCHANT_INACTIVE`) serta skenario kegagalan transaksi.

Contoh input checkout minimal (1 item):

- `sessionId`: `11111111-1111-1111-1111-111111111111`
- `merchantId`: `22222222-2222-2222-2222-222222222222`
- `customerName`: `Test Customer`
- `customerPhone`: `081234567890`
- `items`: 1 item dengan `menuId`, `menuName`, `quantity`, `unitPrice`

Tabel data uji:

| Path | Data uji (input) | Perilaku mock repository | Ekspektasi hasil |
|---|---|---|---|
| P1 | **Menu/merchant tidak tersedia**: gunakan data checkout valid, namun set `menus.isAvailable = false` untuk salah satu `menuId` pada request (atau set `merchants.isAvailable = false` untuk merchant terkait) | Transaksi **dibatalkan**; tidak ada `orders`/`order_items` yang tersimpan | Mengembalikan error bisnis `MENU_UNAVAILABLE` (atau `MERCHANT_INACTIVE`) |
| P2 | **Data valid (normal)**: seluruh merchant/menu tersedia (`isAvailable = true`) dan seluruh referensi ID valid | Transaksi membuat order dan order items | Mengembalikan respons sukses (`success: true`) dengan daftar order yang dibuat |
| P3 | **Kegagalan transaksi**: data valid seperti P2, namun dipaksa terjadi error insert (misalnya gangguan DB/constraint) | Transaksi **dibatalkan** | Mengembalikan `INTERNAL_SERVER_ERROR` |

---

**f. Tangkapan layar hasil**

Tangkapan layar yang dilampirkan berasal dari hasil eksekusi pengujian unit (Jest) untuk path P1–P3.

---

**g. Tabel kasus dan hasil uji (format laporan)**

Tabel berikut disusun berdasarkan basis path P1–P3 pada checkout `POST /api/orders/batch`. Bagian **Pengamatan** dan referensi **Lampiran** dapat disesuaikan dengan hasil eksekusi pengujian dan dokumentasi yang dilampirkan.

| Kelas | Metode | Data Masukan | Yang Diharapkan | Pengamatan* | Kesimpulan |
|---|---|---|---|---|---|
| (Checkout API) | `POST /api/orders/batch` | **Kasus P1 — menu/merchant tidak tersedia**: data checkout valid, namun menu yang dipesan memiliki `isAvailable = false` (atau merchant `isAvailable = false`). | Sistem menolak proses checkout dan mengembalikan error bisnis `MENU_UNAVAILABLE` (atau `MERCHANT_INACTIVE`). Order tidak dibuat (transaksi dibatalkan). | (Isi sesuai hasil uji; contoh: *Teramati error MENU_UNAVAILABLE sesuai ekspektasi*). | [X] diterima / [ ] ditolak |
| (Checkout API) | `POST /api/orders/batch` | **Kasus P2 — data valid (normal)**: seluruh merchant/menu tersedia (`isAvailable = true`) dan ID valid. | Sistem memproses checkout dan mengembalikan respons sukses; order dan order items tersimpan. | (Isi sesuai hasil uji; contoh: *Teramati success true dan order tersimpan*). | [X] diterima / [ ] ditolak |
| (Checkout API) | `POST /api/orders/batch` | **Kasus P3 — kegagalan transaksi/database**: data valid seperti P2, namun dipaksa terjadi kegagalan pada saat insert (misalnya gangguan DB/constraint). | Sistem membatalkan transaksi dan mengembalikan `INTERNAL_SERVER_ERROR`. | (Isi sesuai hasil uji; contoh: *Teramati error 500 sesuai ekspektasi*). | [X] diterima / [ ] ditolak |

\*Pengamatan diisi berdasarkan hasil eksekusi pengujian (misalnya output Jest) dan dapat dirujuk pada lampiran (screenshot/log) yang disediakan.

Langkah menjalankan (contoh):

1. Jalankan: `npm test`
2. Pastikan pengujian yang mencakup checkout batch (`POST /api/orders/batch`) menampilkan status **PASS**.
3. Ambil screenshot hasil output pada terminal dan tempel pada laporan.
