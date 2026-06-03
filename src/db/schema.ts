import { pgTable, uuid, varchar, text, timestamp, numeric, boolean, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).default('seller').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  dimension: varchar('dimension', { length: 20 }).notNull(),
  baseUnit: varchar('base_unit', { length: 20 }).notNull(),
  basePrice: numeric('base_price', { precision: 15, scale: 6 }).notNull(),
  stockQuantity: numeric('stock_quantity', { precision: 20, scale: 8 }).default('0').notNull(),
  minOrderQuantity: numeric('min_order_quantity', { precision: 20, scale: 8 }).default('1').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    categoryIdx: index('idx_products_category').on(table.categoryId),
    skuIdx: index('idx_products_sku').on(table.sku),
  };
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    sellerIdx: index('idx_orders_seller').on(table.sellerId),
    statusIdx: index('idx_orders_status').on(table.status),
  };
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }),
  orderedQuantity: numeric('ordered_quantity', { precision: 20, scale: 8 }).notNull(),
  orderedUnit: varchar('ordered_unit', { length: 20 }).notNull(),
  quantityInBaseUnit: numeric('quantity_in_base_unit', { precision: 20, scale: 8 }).notNull(),
  unitPriceSnapshot: numeric('unit_price_snapshot', { precision: 15, scale: 6 }).notNull(),
  lineTotal: numeric('line_total', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    orderIdx: index('idx_order_items_order').on(table.orderId),
  };
});
