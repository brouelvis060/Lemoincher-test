import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { Product, CartItemWithProduct } from "@shared/schema";
import { useAuth } from "./auth";

interface GuestCartItem {
  productId: string;
  quantity: number;
  variationId?: string;
  product: Product;
}

interface CartContextType {
  items: CartItemWithProduct[];
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number, variationId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  totalWeight: number;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = "lemoincher_guest_cart";

function getGuestCart(): GuestCartItem[] {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevUserIdRef = useRef<string | null>(null);
  const initialLoadDone = useRef(false);

  const fetchCart = async () => {
    if (!user) {
      const guestItems = getGuestCart();
      const cartItems: CartItemWithProduct[] = guestItems.map((item, index) => ({
        id: `guest-${index}`,
        userId: "guest",
        productId: item.productId,
        quantity: item.quantity,
        variationId: item.variationId,
        product: item.product,
      }));
      setItems(cartItems);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const transferGuestCartToServer = async () => {
    if (!user) return;
    
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;
    
    for (const item of guestItems) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            productId: item.productId,
            quantity: item.quantity,
            variationId: item.variationId,
          }),
        });
      } catch (error) {
        console.error("Failed to transfer guest cart item:", error);
      }
    }
    
    clearGuestCart();
    await fetchCart();
  };

  // Wait for auth to finish loading before loading cart
  useEffect(() => {
    if (authLoading) return;
    
    // Initial load or user change
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchCart();
      prevUserIdRef.current = user?.id || null;
      return;
    }
    
    // User just logged in - transfer guest cart
    if (user && !prevUserIdRef.current) {
      transferGuestCartToServer();
    } else if (user?.id !== prevUserIdRef.current) {
      // User changed
      fetchCart();
    }
    
    prevUserIdRef.current = user?.id || null;
  }, [user?.id, authLoading]);

  const addToCart = async (product: Product, quantity = 1, variationId?: string) => {
    if (!user) {
      const guestItems = getGuestCart();
      const existingIndex = guestItems.findIndex(
        (item) => item.productId === product.id && item.variationId === variationId
      );
      
      if (existingIndex >= 0) {
        guestItems[existingIndex].quantity += quantity;
      } else {
        guestItems.push({ productId: product.id, quantity, variationId, product });
      }
      
      saveGuestCart(guestItems);
      await fetchCart();
      return;
    }
    
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          quantity,
          variationId,
        }),
      });
      
      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    if (!user && itemId.startsWith("guest-")) {
      const guestItems = getGuestCart();
      const index = parseInt(itemId.replace("guest-", ""));
      if (guestItems[index]) {
        guestItems[index].quantity = quantity;
        saveGuestCart(guestItems);
        await fetchCart();
      }
      return;
    }
    
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      
      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user && itemId.startsWith("guest-")) {
      const guestItems = getGuestCart();
      const index = parseInt(itemId.replace("guest-", ""));
      guestItems.splice(index, 1);
      saveGuestCart(guestItems);
      await fetchCart();
      return;
    }
    
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to remove from cart:", error);
    }
  };

  const clearCart = async () => {
    if (!user) {
      clearGuestCart();
      setItems([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/cart/clear/${user.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.product.price) * (item.quantity || 0));
  }, 0);
  const totalWeight = items.reduce((sum, item) => {
    return sum + (parseFloat(item.product.weight || "0") * (item.quantity || 0));
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        totalWeight,
        refetch: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
