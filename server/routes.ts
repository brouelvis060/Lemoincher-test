import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [hashedPassword, salt] = hash.split(".");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashedPassword, "hex"), buf);
}

function generateOrderNumber(): string {
  const date = new Date();
  const prefix = date.getFullYear().toString().slice(-2) + 
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CMD-${prefix}-${suffix}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, whatsapp, isWhatsappSameAsPhone } = req.body;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        whatsapp: isWhatsappSameAsPhone ? phone : whatsapp,
        isWhatsappSameAsPhone,
        role: "client",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erreur de connexion" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(({ password, ...u }) => u));
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) return res.status(404).json({ message: "Catégorie non trouvée" });
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const products = await storage.getProducts(activeOnly);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/products/active", async (req, res) => {
    try {
      const products = await storage.getProducts(true);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: "Produit non trouvé" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) return res.status(404).json({ message: "Produit non trouvé" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Product Attributes routes
  app.get("/api/products/:productId/attributes", async (req, res) => {
    try {
      const attributes = await storage.getProductAttributes(req.params.productId);
      res.json(attributes);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/products/:productId/attributes", async (req, res) => {
    try {
      const attribute = await storage.createProductAttribute({
        ...req.body,
        productId: req.params.productId
      });
      res.json(attribute);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/attributes/:id", async (req, res) => {
    try {
      const attribute = await storage.updateProductAttribute(req.params.id, req.body);
      if (!attribute) return res.status(404).json({ message: "Attribut non trouvé" });
      res.json(attribute);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/attributes/:id", async (req, res) => {
    try {
      await storage.deleteProductAttribute(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/products/:productId/attributes", async (req, res) => {
    try {
      await storage.deleteProductAttributes(req.params.productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Product Variations routes
  app.get("/api/products/:productId/variations", async (req, res) => {
    try {
      const variations = await storage.getProductVariations(req.params.productId);
      res.json(variations);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/products/:productId/variations", async (req, res) => {
    try {
      const variation = await storage.createProductVariation({
        ...req.body,
        productId: req.params.productId
      });
      res.json(variation);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/variations/:id", async (req, res) => {
    try {
      const variation = await storage.updateProductVariation(req.params.id, req.body);
      if (!variation) return res.status(404).json({ message: "Variation non trouvée" });
      res.json(variation);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/variations/:id", async (req, res) => {
    try {
      await storage.deleteProductVariation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/products/:productId/variations", async (req, res) => {
    try {
      await storage.deleteProductVariations(req.params.productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Addresses routes
  app.get("/api/addresses", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ message: "userId requis" });
      const addresses = await storage.getAddresses(userId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/addresses", async (req, res) => {
    try {
      const address = await storage.createAddress(req.body);
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/addresses/:id", async (req, res) => {
    try {
      const address = await storage.updateAddress(req.params.id, req.body);
      if (!address) return res.status(404).json({ message: "Adresse non trouvée" });
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/addresses/:id", async (req, res) => {
    try {
      await storage.deleteAddress(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/orders/user/:userId", async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.params.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const orderNumber = generateOrderNumber();

      const order = await storage.createOrder({
        ...orderData,
        orderNumber,
        status: "pending",
      });

      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          weight: item.weight,
        });
      }

      await storage.createPayment({
        orderId: order.id,
        amount: orderData.total,
        method: orderData.paymentMethod,
        status: orderData.paymentMethod === "cash_on_delivery" ? "pending" : "pending",
      });

      const user = await storage.getUser(orderData.userId);
      if (user) {
        await storage.updateUser(user.id, {
          totalOrders: (user.totalOrders || 0) + 1,
          isFaithfulClient: (user.totalOrders || 0) + 1 >= 10,
        });
      }

      const fullOrder = await storage.getOrder(order.id);
      res.json(fullOrder);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Erreur lors de la création de la commande" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) return res.status(404).json({ message: "Commande non trouvée" });

      if (req.body.status === "delivered" && order.userId) {
        const user = await storage.getUser(order.userId);
        if (user && order.paymentMethod === "cash_on_delivery") {
          const payment = await storage.getPaymentByOrder(order.id);
          if (payment) {
            await storage.updatePayment(payment.id, { status: "completed" });
          }
        }
      }

      if (req.body.clientConfirmedPickup && order.userId) {
        const user = await storage.getUser(order.userId);
        if (user) {
          const newUncollected = Math.max(0, (user.uncollectedOrders || 0) - 1);
          await storage.updateUser(user.id, {
            uncollectedOrders: newUncollected,
            isBirdClient: newUncollected >= 2,
            cashOnDeliveryDisabled: newUncollected >= 2,
          });
        }
      }

      const fullOrder = await storage.getOrder(order.id);
      res.json(fullOrder);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ message: "userId requis" });
      const items = await storage.getCartItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const item = await storage.addToCart(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const item = await storage.updateCartItem(req.params.id, req.body.quantity);
      if (!item) return res.status(404).json({ message: "Article non trouvé" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/cart/clear/:userId", async (req, res) => {
    try {
      await storage.clearCart(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Shipping routes
  app.get("/api/shipping/calculate", async (req, res) => {
    try {
      const weight = parseFloat(req.query.weight as string) || 0;
      const isAbidjan = req.query.isAbidjan === "true";
      const fees = await storage.calculateShippingFee(weight, isAbidjan);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/shipping-rules", async (req, res) => {
    try {
      const rules = await storage.getShippingRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/shipping-rules", async (req, res) => {
    try {
      const rule = await storage.createShippingRule(req.body);
      res.json(rule);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/shipping-rules/:id", async (req, res) => {
    try {
      const rule = await storage.updateShippingRule(req.params.id, req.body);
      if (!rule) return res.status(404).json({ message: "Règle non trouvée" });
      res.json(rule);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/shipping-rules/:id", async (req, res) => {
    try {
      await storage.deleteShippingRule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Settings routes
  app.get("/api/settings/site", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/settings/site", async (req, res) => {
    try {
      const settings = await storage.updateSiteSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/settings/payments", async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/settings/payments", async (req, res) => {
    try {
      const settings = await storage.updatePaymentSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/settings/sms", async (req, res) => {
    try {
      const settings = await storage.getSmsSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/settings/sms", async (req, res) => {
    try {
      const settings = await storage.updateSmsSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Admin stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Media files routes
  app.get("/api/media", async (req, res) => {
    try {
      const files = await storage.getMediaFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/media", async (req, res) => {
    try {
      const file = await storage.createMediaFile(req.body);
      res.json(file);
    } catch (error) {
      console.error("Create media error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      await storage.deleteMediaFile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  return httpServer;
}
