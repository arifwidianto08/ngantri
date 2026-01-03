# 🛠️ Operations & Maintenance

Dokumentasi ini berisi perintah-perintah operasional yang digunakan untuk mengelola layanan, database, serta proses deployment aplikasi **Ngantri**.

---

## 🐳 Docker Commands

Perintah berikut digunakan untuk mengelola container PostgreSQL menggunakan Docker Compose.

| Command                  | Description                   |
| ------------------------ | ----------------------------- |
| `npm run docker:up`      | Start PostgreSQL container    |
| `npm run docker:down`    | Stop PostgreSQL container     |
| `npm run docker:logs`    | View PostgreSQL logs          |
| `npm run docker:clean`   | Remove containers & volumes   |
| `npm run docker:restart` | Restart Docker services       |

---

## 🗃️ Database Commands

Perintah berikut digunakan untuk pengelolaan database menggunakan **Drizzle ORM**.

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `npm run db:generate` | Generate Drizzle migrations       |
| `npm run db:migrate`  | Run database migrations           |
| `npm run db:studio`   | Open Drizzle Studio               |
| `npm run db:seed`     | Seed test data                    |
| `npm run db:reset`    | Reset database completely         |
| `npm run db:wait`     | Wait database connection          |

---

## 🔑 Test Credentials

Setelah proses seeding database selesai, akun berikut dapat digunakan untuk keperluan testing:

| Merchant           | Phone          | Password    | Description    |
| ------------------ | -------------- | ----------- | -------------- |
| Warung Nasi Padang | +6281234567890 | password123 | Padang cuisine |
| Bakso Malang       | +6281234567891 | password123 | Meatball soup  |

---

## 🚀 Deployment

Untuk proses deployment, disarankan menggunakan **Vercel** karena dukungan native terhadap Next.js.

Langkah umum deployment:
- Hubungkan repository GitHub ke Vercel
- Konfigurasikan environment variables
- Jalankan proses deploy

📖 Referensi:
- Next.js Deployment Documentation
