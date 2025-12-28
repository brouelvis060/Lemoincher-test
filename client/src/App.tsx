import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { SiteSettingsProvider } from "@/lib/site-settings";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import ProductsPage from "@/pages/products";
import ProductDetailPage from "@/pages/product-detail";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import OrdersPage from "@/pages/orders";
import OrderDetailPage from "@/pages/order-detail";
import ProfilePage from "@/pages/profile";

import { AdminLayout } from "@/pages/admin/layout";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminProductForm from "@/pages/admin/product-form";
import AdminCategories from "@/pages/admin/categories";
import AdminOrders from "@/pages/admin/orders";
import AdminOrderForm from "@/pages/admin/order-form";
import AdminUsers from "@/pages/admin/users";
import AdminSiteSettings from "@/pages/admin/settings/site";
import AdminShippingSettings from "@/pages/admin/settings/shipping";
import AdminPaymentSettings from "@/pages/admin/settings/payments";
import AdminSmsSettings from "@/pages/admin/settings/sms";
import AdminMedia from "@/pages/admin/media";
import AdminAttributes from "@/pages/admin/attributes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/product/:id" component={ProductDetailPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/orders/:id" component={OrderDetailPage} />
      <Route path="/profile" component={ProfilePage} />

      <Route path="/admin">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>
      <Route path="/admin/products">
        <AdminLayout><AdminProducts /></AdminLayout>
      </Route>
      <Route path="/admin/products/new">
        <AdminLayout><AdminProductForm /></AdminLayout>
      </Route>
      <Route path="/admin/products/:id">
        <AdminLayout><AdminProductForm /></AdminLayout>
      </Route>
      <Route path="/admin/categories">
        <AdminLayout><AdminCategories /></AdminLayout>
      </Route>
      <Route path="/admin/attributes">
        <AdminLayout><AdminAttributes /></AdminLayout>
      </Route>
      <Route path="/admin/orders">
        <AdminLayout><AdminOrders /></AdminLayout>
      </Route>
      <Route path="/admin/orders/new">
        <AdminLayout><AdminOrderForm /></AdminLayout>
      </Route>
      <Route path="/admin/orders/:id">
        <AdminLayout><AdminOrders /></AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout><AdminUsers /></AdminLayout>
      </Route>
      <Route path="/admin/settings/site">
        <AdminLayout><AdminSiteSettings /></AdminLayout>
      </Route>
      <Route path="/admin/settings/shipping">
        <AdminLayout><AdminShippingSettings /></AdminLayout>
      </Route>
      <Route path="/admin/settings/payments">
        <AdminLayout><AdminPaymentSettings /></AdminLayout>
      </Route>
      <Route path="/admin/settings/sms">
        <AdminLayout><AdminSmsSettings /></AdminLayout>
      </Route>
      <Route path="/admin/media">
        <AdminLayout><AdminMedia /></AdminLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
