import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "client"]);
export const orderStatusEnum = pgEnum("order_status", ["pending_payment", "pending", "confirmed", "shipped", "at_station", "delivered", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["mobile_money", "cash_on_delivery"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const productTypeEnum = pgEnum("product_type", ["simple", "variable"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  isWhatsappSameAsPhone: boolean("is_whatsapp_same_as_phone").default(true),
  whatsappVerified: boolean("whatsapp_verified").default(false),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileImage: text("profile_image"),
  role: userRoleEnum("role").default("client").notNull(),
  totalOrders: integer("total_orders").default(0),
  uncollectedOrders: integer("uncollected_orders").default(0),
  isFaithfulClient: boolean("is_faithful_client").default(false),
  isBirdClient: boolean("is_bird_client").default(false),
  cashOnDeliveryDisabled: boolean("cash_on_delivery_disabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  isActive: boolean("is_active").default(true),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  productType: productTypeEnum("product_type").default("simple").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  weight: decimal("weight", { precision: 10, scale: 2 }).default("0"),
  images: text("images").array(),
  categoryId: varchar("category_id").references(() => categories.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Global attributes (like WooCommerce - created separately, then selected in products)
export const attributes = pgTable("attributes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true),
});

export const attributeValues = pgTable("attribute_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attributeId: varchar("attribute_id").references(() => attributes.id).notNull(),
  value: text("value").notNull(),
  slug: text("slug").notNull(),
});

// Legacy table - keeping for migration compatibility but no longer used
export const productAttributes = pgTable("product_attributes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  name: text("name").notNull(),
  values: text("values").array().notNull(),
});

export const productVariations = pgTable("product_variations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  attributeValues: text("attribute_values").notNull(),
  sku: text("sku"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  weight: decimal("weight", { precision: 10, scale: 2 }).default("0"),
  image: text("image"),
  isActive: boolean("is_active").default(true),
});

export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  label: text("label").notNull(),
  fullAddress: text("full_address").notNull(),
  city: text("city").notNull(),
  zone: text("zone"),
  isAbidjan: boolean("is_abidjan").default(false),
  isDefault: boolean("is_default").default(false),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  addressId: varchar("address_id").references(() => addresses.id),
  status: orderStatusEnum("status").default("pending").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 }).default("0"),
  weightFee: decimal("weight_fee", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  stationReceiptImage: text("station_receipt_image"),
  clientConfirmedPickup: boolean("client_confirmed_pickup").default(false),
  paymentExpiresAt: timestamp("payment_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  productName: text("product_name").notNull(),
  productPrice: decimal("product_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }).default("0"),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  transactionId: text("transaction_id"),
  cinetpayReference: text("cinetpay_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteName: text("site_name").default("Lemoincher"),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#D97706"),
  secondaryColor: text("secondary_color").default("#1F2937"),
  aboutPage: text("about_page"),
  contactPage: text("contact_page"),
  termsPage: text("terms_page"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
});

export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cinetpayApiKey: text("cinetpay_api_key"),
  cinetpaySecretKey: text("cinetpay_secret_key"),
  cinetpaySiteId: text("cinetpay_site_id"),
  cinetpayWebhookUrl: text("cinetpay_webhook_url"),
  cashOnDeliveryEnabled: boolean("cash_on_delivery_enabled").default(true),
  cashOnDeliveryAbidjanOnly: boolean("cash_on_delivery_abidjan_only").default(true),
});

export const smsSettings = pgTable("sms_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  twilioSid: text("twilio_sid"),
  twilioToken: text("twilio_token"),
  twilioFromNumber: text("twilio_from_number"),
  smsEnabled: boolean("sms_enabled").default(false),
});

export const shippingRules = pgTable("shipping_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  minWeight: decimal("min_weight", { precision: 10, scale: 2 }).default("0"),
  maxWeight: decimal("max_weight", { precision: 10, scale: 2 }),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  distanceFeeAbidjan: decimal("distance_fee_abidjan", { precision: 10, scale: 2 }).default("1000"),
  distanceFeeOutside: decimal("distance_fee_outside", { precision: 10, scale: 2 }).default("3000"),
  isActive: boolean("is_active").default(true),
});

export const mediaFiles = pgTable("media_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  objectPath: text("object_path").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").default(1),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  cartItems: many(cartItems),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  attributes: many(productAttributes),
  variations: many(productVariations),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const productAttributesRelations = relations(productAttributes, ({ one }) => ({
  product: one(products, {
    fields: [productAttributes.productId],
    references: [products.id],
  }),
}));

export const attributesRelations = relations(attributes, ({ many }) => ({
  values: many(attributeValues),
}));

export const attributeValuesRelations = relations(attributeValues, ({ one }) => ({
  attribute: one(attributes, {
    fields: [attributeValues.attributeId],
    references: [attributes.id],
  }),
}));

export const productVariationsRelations = relations(productVariations, ({ one }) => ({
  product: one(products, {
    fields: [productVariations.productId],
    references: [products.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id],
  }),
  items: many(orderItems),
  payment: one(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertAddressSchema = createInsertSchema(addresses).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({ id: true });
export const insertSmsSettingsSchema = createInsertSchema(smsSettings).omit({ id: true });
export const insertShippingRuleSchema = createInsertSchema(shippingRules).omit({ id: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });
export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({ id: true, createdAt: true });
export const insertAttributeSchema = createInsertSchema(attributes).omit({ id: true });
export const insertAttributeValueSchema = createInsertSchema(attributeValues).omit({ id: true });
export const insertProductAttributeSchema = createInsertSchema(productAttributes).omit({ id: true });
export const insertProductVariationSchema = createInsertSchema(productVariations).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertSmsSettings = z.infer<typeof insertSmsSettingsSchema>;
export type SmsSettings = typeof smsSettings.$inferSelect;
export type InsertShippingRule = z.infer<typeof insertShippingRuleSchema>;
export type ShippingRule = typeof shippingRules.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertAttribute = z.infer<typeof insertAttributeSchema>;
export type Attribute = typeof attributes.$inferSelect;
export type InsertAttributeValue = z.infer<typeof insertAttributeValueSchema>;
export type AttributeValue = typeof attributeValues.$inferSelect;
export type InsertProductAttribute = z.infer<typeof insertProductAttributeSchema>;
export type ProductAttribute = typeof productAttributes.$inferSelect;
export type InsertProductVariation = z.infer<typeof insertProductVariationSchema>;
export type ProductVariation = typeof productVariations.$inferSelect;

// Extended types for frontend
export type AttributeWithValues = Attribute & { values: AttributeValue[] };
export type ProductWithCategory = Product & { category?: Category; attributes?: ProductAttribute[]; variations?: ProductVariation[] };
export type OrderWithDetails = Order & { 
  items: (OrderItem & { product?: Product })[];
  address?: Address;
  user?: User;
  payment?: Payment;
};
export type CartItemWithProduct = CartItem & { product: Product };
