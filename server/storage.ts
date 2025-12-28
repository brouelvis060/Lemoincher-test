import { 
  users, categories, products, addresses, orders, orderItems, 
  payments, siteSettings, paymentSettings, smsSettings, shippingRules, cartItems, mediaFiles, productAttributes, productVariations,
  type User, type InsertUser, type Category, type InsertCategory,
  type Product, type InsertProduct, type Address, type InsertAddress,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Payment, type InsertPayment, type SiteSettings, type InsertSiteSettings,
  type PaymentSettings, type InsertPaymentSettings, type SmsSettings, type InsertSmsSettings,
  type ShippingRule, type InsertShippingRule, type CartItem, type InsertCartItem,
  type MediaFile, type InsertMediaFile, type ProductAttribute, type InsertProductAttribute,
  type ProductVariation, type InsertProductVariation,
  type ProductWithCategory, type OrderWithDetails, type CartItemWithProduct
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Products
  getProducts(activeOnly?: boolean): Promise<ProductWithCategory[]>;
  getProduct(id: string): Promise<ProductWithCategory | undefined>;
  getProductsByCategory(categoryId: string): Promise<ProductWithCategory[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Addresses
  getAddresses(userId: string): Promise<Address[]>;
  getAddress(id: string): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, data: Partial<InsertAddress>): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<OrderWithDetails[]>;
  getOrdersByUser(userId: string): Promise<OrderWithDetails[]>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithDetails | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined>;

  // Order Items
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  getPaymentByOrder(orderId: string): Promise<Payment | undefined>;

  // Settings
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(data: Partial<InsertSiteSettings>): Promise<SiteSettings>;
  getPaymentSettings(): Promise<PaymentSettings | undefined>;
  updatePaymentSettings(data: Partial<InsertPaymentSettings>): Promise<PaymentSettings>;
  getSmsSettings(): Promise<SmsSettings | undefined>;
  updateSmsSettings(data: Partial<InsertSmsSettings>): Promise<SmsSettings>;

  // Shipping Rules
  getShippingRules(): Promise<ShippingRule[]>;
  getShippingRule(id: string): Promise<ShippingRule | undefined>;
  createShippingRule(rule: InsertShippingRule): Promise<ShippingRule>;
  updateShippingRule(id: string, data: Partial<InsertShippingRule>): Promise<ShippingRule | undefined>;
  deleteShippingRule(id: string): Promise<boolean>;
  calculateShippingFee(weight: number, isAbidjan: boolean): Promise<{ weightFee: number; distanceFee: number }>;

  // Cart
  getCartItems(userId: string): Promise<CartItemWithProduct[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;

  // Media Files
  getMediaFiles(): Promise<MediaFile[]>;
  getMediaFile(id: string): Promise<MediaFile | undefined>;
  createMediaFile(file: InsertMediaFile): Promise<MediaFile>;
  deleteMediaFile(id: string): Promise<boolean>;

  // Product Attributes
  getProductAttributes(productId: string): Promise<ProductAttribute[]>;
  createProductAttribute(attribute: InsertProductAttribute): Promise<ProductAttribute>;
  updateProductAttribute(id: string, data: Partial<InsertProductAttribute>): Promise<ProductAttribute | undefined>;
  deleteProductAttribute(id: string): Promise<boolean>;
  deleteProductAttributes(productId: string): Promise<boolean>;

  // Product Variations
  getProductVariations(productId: string): Promise<ProductVariation[]>;
  createProductVariation(variation: InsertProductVariation): Promise<ProductVariation>;
  updateProductVariation(id: string, data: Partial<InsertProductVariation>): Promise<ProductVariation | undefined>;
  deleteProductVariation(id: string): Promise<boolean>;
  deleteProductVariations(productId: string): Promise<boolean>;

  // Stats
  getDashboardStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "client")).orderBy(desc(users.createdAt));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category).returning();
    return result;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [result] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return result || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // Products
  async getProducts(activeOnly = false): Promise<ProductWithCategory[]> {
    const query = activeOnly
      ? db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt))
      : db.select().from(products).orderBy(desc(products.createdAt));
    
    const productList = await query;
    const result: ProductWithCategory[] = [];
    
    for (const product of productList) {
      let category: Category | undefined;
      if (product.categoryId) {
        category = await this.getCategory(product.categoryId);
      }
      result.push({ ...product, category });
    }
    
    return result;
  }

  async getProduct(id: string): Promise<ProductWithCategory | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return undefined;
    
    let category: Category | undefined;
    if (product.categoryId) {
      category = await this.getCategory(product.categoryId);
    }
    
    const variations = await this.getProductVariations(id);
    
    return { ...product, category, variations };
  }

  async getProductsByCategory(categoryId: string): Promise<ProductWithCategory[]> {
    const productList = await db.select().from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt));
    
    const category = await this.getCategory(categoryId);
    return productList.map(p => ({ ...p, category }));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [result] = await db.insert(products).values(product).returning();
    return result;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [result] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return result || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  // Addresses
  async getAddresses(userId: string): Promise<Address[]> {
    return db.select().from(addresses).where(eq(addresses.userId, userId));
  }

  async getAddress(id: string): Promise<Address | undefined> {
    const [address] = await db.select().from(addresses).where(eq(addresses.id, id));
    return address || undefined;
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const [result] = await db.insert(addresses).values(address).returning();
    return result;
  }

  async updateAddress(id: string, data: Partial<InsertAddress>): Promise<Address | undefined> {
    const [result] = await db.update(addresses).set(data).where(eq(addresses.id, id)).returning();
    return result || undefined;
  }

  async deleteAddress(id: string): Promise<boolean> {
    await db.delete(addresses).where(eq(addresses.id, id));
    return true;
  }

  // Orders
  async getOrders(): Promise<OrderWithDetails[]> {
    const orderList = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const result: OrderWithDetails[] = [];
    
    for (const order of orderList) {
      const items = await this.getOrderItems(order.id);
      const address = order.addressId ? await this.getAddress(order.addressId) : undefined;
      const user = await this.getUser(order.userId);
      const payment = await this.getPaymentByOrder(order.id);
      
      const itemsWithProducts = await Promise.all(items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return { ...item, product };
      }));
      
      result.push({ ...order, items: itemsWithProducts, address, user, payment });
    }
    
    return result;
  }

  async getOrdersByUser(userId: string): Promise<OrderWithDetails[]> {
    const orderList = await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    
    const result: OrderWithDetails[] = [];
    
    for (const order of orderList) {
      const items = await this.getOrderItems(order.id);
      const address = order.addressId ? await this.getAddress(order.addressId) : undefined;
      const payment = await this.getPaymentByOrder(order.id);
      
      const itemsWithProducts = await Promise.all(items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return { ...item, product };
      }));
      
      result.push({ ...order, items: itemsWithProducts, address, payment });
    }
    
    return result;
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    
    const items = await this.getOrderItems(order.id);
    const address = order.addressId ? await this.getAddress(order.addressId) : undefined;
    const user = await this.getUser(order.userId);
    const payment = await this.getPaymentByOrder(order.id);
    
    const itemsWithProducts = await Promise.all(items.map(async (item) => {
      const product = await this.getProduct(item.productId);
      return { ...item, product };
    }));
    
    return { ...order, items: itemsWithProducts, address, user, payment };
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderWithDetails | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    if (!order) return undefined;
    return this.getOrder(order.id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values(order).returning();
    return result;
  }

  async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const updateData = { ...data, updatedAt: new Date() };
    const [result] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
    return result || undefined;
  }

  // Order Items
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [result] = await db.insert(orderItems).values(item).returning();
    return result;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [result] = await db.insert(payments).values(payment).returning();
    return result;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [result] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return result || undefined;
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment || undefined;
  }

  // Settings
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const [settings] = await db.select().from(siteSettings);
    return settings || undefined;
  }

  async updateSiteSettings(data: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    if (existing) {
      const [result] = await db.update(siteSettings).set(data).where(eq(siteSettings.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(siteSettings).values(data as InsertSiteSettings).returning();
    return result;
  }

  async getPaymentSettings(): Promise<PaymentSettings | undefined> {
    const [settings] = await db.select().from(paymentSettings);
    return settings || undefined;
  }

  async updatePaymentSettings(data: Partial<InsertPaymentSettings>): Promise<PaymentSettings> {
    const existing = await this.getPaymentSettings();
    if (existing) {
      const [result] = await db.update(paymentSettings).set(data).where(eq(paymentSettings.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(paymentSettings).values(data as InsertPaymentSettings).returning();
    return result;
  }

  async getSmsSettings(): Promise<SmsSettings | undefined> {
    const [settings] = await db.select().from(smsSettings);
    return settings || undefined;
  }

  async updateSmsSettings(data: Partial<InsertSmsSettings>): Promise<SmsSettings> {
    const existing = await this.getSmsSettings();
    if (existing) {
      const [result] = await db.update(smsSettings).set(data).where(eq(smsSettings.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(smsSettings).values(data as InsertSmsSettings).returning();
    return result;
  }

  // Shipping Rules
  async getShippingRules(): Promise<ShippingRule[]> {
    return db.select().from(shippingRules).orderBy(shippingRules.minWeight);
  }

  async getShippingRule(id: string): Promise<ShippingRule | undefined> {
    const [rule] = await db.select().from(shippingRules).where(eq(shippingRules.id, id));
    return rule || undefined;
  }

  async createShippingRule(rule: InsertShippingRule): Promise<ShippingRule> {
    const [result] = await db.insert(shippingRules).values(rule).returning();
    return result;
  }

  async updateShippingRule(id: string, data: Partial<InsertShippingRule>): Promise<ShippingRule | undefined> {
    const [result] = await db.update(shippingRules).set(data).where(eq(shippingRules.id, id)).returning();
    return result || undefined;
  }

  async deleteShippingRule(id: string): Promise<boolean> {
    await db.delete(shippingRules).where(eq(shippingRules.id, id));
    return true;
  }

  async calculateShippingFee(weight: number, isAbidjan: boolean): Promise<{ weightFee: number; distanceFee: number }> {
    const rules = await this.getShippingRules();
    let weightFee = 0;
    let distanceFee = isAbidjan ? 1000 : 3000;
    
    for (const rule of rules) {
      const minW = parseFloat(rule.minWeight || "0");
      const maxW = rule.maxWeight ? parseFloat(rule.maxWeight) : Infinity;
      
      if (weight >= minW && weight < maxW && rule.isActive) {
        weightFee = parseFloat(rule.fee || "0");
        distanceFee = isAbidjan 
          ? parseFloat(rule.distanceFeeAbidjan || "1000")
          : parseFloat(rule.distanceFeeOutside || "3000");
        break;
      }
    }
    
    return { weightFee, distanceFee };
  }

  // Cart
  async getCartItems(userId: string): Promise<CartItemWithProduct[]> {
    const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    const result: CartItemWithProduct[] = [];
    
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        result.push({ ...item, product });
      }
    }
    
    return result;
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const existing = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId)));
    
    if (existing.length > 0) {
      const newQuantity = (existing[0].quantity || 1) + (item.quantity || 1);
      const [result] = await db.update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return result;
    }
    
    const [result] = await db.insert(cartItems).values(item).returning();
    return result;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [result] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return result || undefined;
  }

  async removeFromCart(id: string): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
    return true;
  }

  async clearCart(userId: string): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return true;
  }

  // Media Files
  async getMediaFiles(): Promise<MediaFile[]> {
    return await db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt));
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    const [file] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file || undefined;
  }

  async createMediaFile(file: InsertMediaFile): Promise<MediaFile> {
    const [result] = await db.insert(mediaFiles).values(file).returning();
    return result;
  }

  async deleteMediaFile(id: string): Promise<boolean> {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return true;
  }

  // Product Attributes
  async getProductAttributes(productId: string): Promise<ProductAttribute[]> {
    return await db.select().from(productAttributes).where(eq(productAttributes.productId, productId));
  }

  async createProductAttribute(attribute: InsertProductAttribute): Promise<ProductAttribute> {
    const [result] = await db.insert(productAttributes).values(attribute).returning();
    return result;
  }

  async updateProductAttribute(id: string, data: Partial<InsertProductAttribute>): Promise<ProductAttribute | undefined> {
    const [result] = await db.update(productAttributes).set(data).where(eq(productAttributes.id, id)).returning();
    return result || undefined;
  }

  async deleteProductAttribute(id: string): Promise<boolean> {
    await db.delete(productAttributes).where(eq(productAttributes.id, id));
    return true;
  }

  async deleteProductAttributes(productId: string): Promise<boolean> {
    await db.delete(productAttributes).where(eq(productAttributes.productId, productId));
    return true;
  }

  // Product Variations
  async getProductVariations(productId: string): Promise<ProductVariation[]> {
    return await db.select().from(productVariations).where(eq(productVariations.productId, productId));
  }

  async createProductVariation(variation: InsertProductVariation): Promise<ProductVariation> {
    const [result] = await db.insert(productVariations).values(variation).returning();
    return result;
  }

  async updateProductVariation(id: string, data: Partial<InsertProductVariation>): Promise<ProductVariation | undefined> {
    const [result] = await db.update(productVariations).set(data).where(eq(productVariations.id, id)).returning();
    return result || undefined;
  }

  async deleteProductVariation(id: string): Promise<boolean> {
    await db.delete(productVariations).where(eq(productVariations.id, id));
    return true;
  }

  async deleteProductVariations(productId: string): Promise<boolean> {
    await db.delete(productVariations).where(eq(productVariations.productId, productId));
    return true;
  }

  // Stats
  async getDashboardStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
  }> {
    const allOrders = await db.select().from(orders);
    const pendingOrders = allOrders.filter(o => o.status === "pending" || o.status === "confirmed");
    const completedOrders = allOrders.filter(o => o.status === "delivered");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    
    const productCount = await db.select().from(products);
    const userCount = await db.select().from(users).where(eq(users.role, "client"));
    
    return {
      totalOrders: allOrders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue,
      totalProducts: productCount.length,
      totalUsers: userCount.length,
    };
  }
}

export const storage = new DatabaseStorage();
