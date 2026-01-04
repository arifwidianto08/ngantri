# 🍽️ Ngantri - Food Court Ordering System

A modern web application for managing food court orders built with Next.js 14+, TypeScript, and PostgreSQL.

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 🚀 Setup & Run

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ngantri
   ```

2. **Install dependencies and start services**

   ```bash
   npm run setup
   ```

   This command will:

   - Install all npm dependencies
   - Start PostgreSQL with Docker Compose
   - Wait for database to be ready
   - Run database migrations
   - Seed the database with test data

3. **Start development server**

   ```bash
   npm run dev
   ```

   The application will be available at: http://localhost:3000

## 📚 Project Documentation (VitePress)

This project includes a dedicated documentation site built with **VitePress**.

### ▶️ Run Documentation Locally

To start the documentation server:

```bash
npm run docs:dev
```

The documentation will be available at:

```
http://localhost:5173
```

### 📂 Documentation Structure

All documentation files are located in the `docs/` directory and organized as follows:

```txt
docs/
├─ index.md
└─ guide/
   ├─ overview.md
   ├─ setup.md
   ├─ operations.md
   └─ learn-more.md
```


## 🐳 Docker Commands

| Command                  | Description                   |
| ------------------------ | ----------------------------- |
| `npm run docker:up`      | Start PostgreSQL container    |
| `npm run docker:down`    | Stop PostgreSQL container     |
| `npm run docker:logs`    | View PostgreSQL logs          |
| `npm run docker:clean`   | Remove containers and volumes |
| `npm run docker:restart` | Restart Docker services       |

## 🗃️ Database Commands

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `npm run db:generate` | Generate Drizzle migrations       |
| `npm run db:migrate`  | Run database migrations           |
| `npm run db:studio`   | Open Drizzle Studio (database UI) |
| `npm run db:seed`     | Populate database with test data  |
| `npm run db:reset`    | Reset database completely         |
| `npm run db:wait`     | Wait for database connection      |

## 🔑 Test Credentials

After seeding the database, you can use these test merchant accounts:

| Merchant           | Phone          | Password    | Description    |
| ------------------ | -------------- | ----------- | -------------- |
| Warung Nasi Padang | +6281234567890 | password123 | Padang cuisine |
| Bakso Malang       | +6281234567891 | password123 | Meatball soup  |

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.




