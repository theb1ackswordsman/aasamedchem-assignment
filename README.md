# AASAMEDCHEM — B2B Inventory & Order Management System

A full-stack B2B inventory and order management platform built for chemical suppliers. Admins manage products, inventory, and orders. Sellers browse the catalog, build quotations, and track order status.

## 🌐 Live Demo & Source

| | URL |
|---|---|
| **Live** | YOUR_LIVE_URL |
| **GitHub** | YOUR_GITHUB_URL |

## 🔐 Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@test.com` | `Admin@123` |
| Seller | `seller@test.com` | `Seller@123` |

## ✨ Features

### Admin Panel
- **Dashboard** — Real-time stat cards: Total Products, Pending Orders, Low Stock Items, Total Revenue (INR) + recent orders table
- **Products CRUD** — Create, edit, delete products with SKU, dimension, base unit, base price, stock quantity, and min order quantity
- **Inventory View** — All products with stock levels; amber highlighting for low stock (`stock < min_order_qty × 5`)
- **Orders Management** — View all orders from all sellers, expand to see line items, update order status (pending → confirmed → fulfilled / cancelled)

### Seller Panel
- **Browse Catalog** — Search and filter products by dimension; view live pricing with unit conversion
- **Quotation Builder** — Add products to cart, select quantities and units, see real-time line totals and grand total in INR
- **Order History** — View submitted orders with status tracking and expandable line item details

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Authentication | NextAuth.js v4 (Credentials Provider, JWT) |
| Database | Neon PostgreSQL (Serverless) |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

## 🏗 System Design

The application follows a classic three-tier architecture. The **frontend** uses Next.js 14 App Router with React client components for interactive pages (product tables, quotation builder, order views) and server-side API routes for backend logic. The **backend** API routes handle authentication via NextAuth.js JWT sessions, enforce role-based access control (admin vs. seller), and perform all database operations through Drizzle ORM. The **database** is a Neon serverless PostgreSQL instance connected via the `@neondatabase/serverless` driver, with the schema managed through Drizzle's migration tooling.

## 📊 Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `name` | VARCHAR(255) | |
| `email` | VARCHAR(255) | Unique |
| `password_hash` | TEXT | bcrypt hashed |
| `role` | VARCHAR(50) | `admin` or `seller` |

### `categories`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `name` | VARCHAR(255) | Unique |
| `description` | TEXT | Optional |

### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `name` | VARCHAR(255) | |
| `sku` | VARCHAR(100) | Unique |
| `category_id` | UUID (FK) | → categories.id |
| `dimension` | VARCHAR(20) | `weight`, `volume`, or `count` |
| `base_unit` | VARCHAR(20) | `g`, `mL`, or `unit` |
| `base_price` | NUMERIC(15,6) | Price per base unit in INR |
| `stock_quantity` | NUMERIC(20,8) | Always stored in base unit |
| `min_order_quantity` | NUMERIC(20,8) | In base unit |
| `is_active` | BOOLEAN | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `seller_id` | UUID (FK) | → users.id |
| `status` | VARCHAR(50) | `pending` → `confirmed` → `fulfilled` or `cancelled` |
| `total_amount` | NUMERIC(15,2) | Sum of all line totals |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `order_id` | UUID (FK) | → orders.id |
| `product_id` | UUID (FK) | → products.id |
| `ordered_quantity` | NUMERIC(20,8) | What seller entered |
| `ordered_unit` | VARCHAR(20) | `g`, `kg`, `mL`, `L`, or `unit` |
| `quantity_in_base_unit` | NUMERIC(20,8) | Converted to base |
| `unit_price_snapshot` | NUMERIC(15,6) | Price at time of order |
| `line_total` | NUMERIC(15,2) | = quantity_in_base_unit × unit_price_snapshot |

## 📐 Unit Storage & Conversion Strategy

All quantities are **stored in base units**:
- **Weight**: base unit = `g` (grams)
- **Volume**: base unit = `mL` (milliliters)
- **Count**: base unit = `unit`

When a seller orders in a non-base unit (e.g., `kg` or `L`), the system converts to base:
- `kg → g`: multiply by 1000
- `L → mL`: multiply by 1000

Stock is always tracked and deducted in base units to maintain consistency.

## 💰 Price Formula

```
line_total = quantity_in_base_unit × base_price_per_base_unit
```

**Example**: A product with `base_price = ₹0.46/g`. Seller orders `2 kg`:
1. Convert: `2 kg = 2000 g` (quantity_in_base_unit)
2. Calculate: `2000 × 0.46 = ₹920.00` (line_total)

The `total_amount` on an order is the sum of all `line_total` values.

## 🔢 Data Type Decisions

| Column | Precision | Rationale |
|---|---|---|
| `base_price` | NUMERIC(15,6) | 6 decimal places for precise per-unit pricing (e.g., ₹0.460000/g) |
| `stock_quantity` | NUMERIC(20,8) | 8 decimal places for fractional quantities (e.g., 0.00125000 kg in grams = 1.25) |
| `min_order_quantity` | NUMERIC(20,8) | Matches stock precision for consistent comparisons |
| `ordered_quantity` | NUMERIC(20,8) | Preserves exact seller input |
| `quantity_in_base_unit` | NUMERIC(20,8) | Precise base-unit conversion |
| `unit_price_snapshot` | NUMERIC(15,6) | Snapshot of base_price at order time |
| `line_total` | NUMERIC(15,2) | 2 decimal places — final monetary amount in INR |
| `total_amount` | NUMERIC(15,2) | 2 decimal places — aggregate monetary total |

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js 18+
- A Neon PostgreSQL database ([neon.tech](https://neon.tech))

### Steps

```bash
# 1. Clone the repository
git clone YOUR_GITHUB_URL
cd aasamedchem-project

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in:
#   DATABASE_URL=your_neon_connection_string
#   NEXTAUTH_SECRET=any_random_secret_string

# 4. Push schema to database
npx.cmd drizzle-kit push

# 5. Seed the database (create test users)
# Run the following SQL in your Neon console:
# INSERT INTO users (name, email, password_hash, role) VALUES
#   ('Admin User', 'admin@test.com', '<bcrypt hash of Admin@123>', 'admin'),
#   ('Seller User', 'seller@test.com', '<bcrypt hash of Seller@123>', 'seller');
#
# Generate bcrypt hashes using: node -e "const b=require('bcryptjs');b.hash('Admin@123',10).then(h=>console.log(h))"

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ☁️ Vercel Deployment Steps

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add these **Environment Variables** in Vercel project settings:
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — a random secret string
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
4. Click **Deploy**
5. Ensure the database is already seeded with test users

## 📖 How to Use

### Admin Walkthrough
1. Log in with `admin@test.com` / `Admin@123`
2. You'll land on the **Dashboard** — view key stats and recent orders
3. Navigate to **Products** — add new products with dimension, base unit, pricing, and stock
4. Check **Inventory** — see all stock levels; amber-highlighted rows indicate low stock
5. Go to **Orders** — view all seller orders, expand rows for line item details, update status via dropdown

### Seller Walkthrough
1. Log in with `seller@test.com` / `Seller@123`
2. Go to **Browse Products** — search and filter the catalog by dimension
3. Add desired products to your quotation cart
4. Navigate to **Build Quotation** — adjust quantities and units, see live price calculations
5. Submit the quotation — this creates an order and deducts stock
6. Check **My Quotations** — track order status (pending → confirmed → fulfilled)
