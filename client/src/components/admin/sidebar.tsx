import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Truck,
  CreditCard,
  MessageSquare,
  Palette,
  FolderTree,
  LogOut,
  Store,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useSiteSettings } from "@/lib/site-settings";

const mainMenuItems = [
  { title: "Tableau de bord", url: "/admin", icon: LayoutDashboard },
  { title: "Produits", url: "/admin/products", icon: Package },
  { title: "Catégories", url: "/admin/categories", icon: FolderTree },
  { title: "Commandes", url: "/admin/orders", icon: ShoppingCart },
  { title: "Clients", url: "/admin/users", icon: Users },
  { title: "Médiathèque", url: "/admin/media", icon: Image },
];

const settingsMenuItems = [
  { title: "Site", url: "/admin/settings/site", icon: Palette },
  { title: "Livraison", url: "/admin/settings/shipping", icon: Truck },
  { title: "Paiements", url: "/admin/settings/payments", icon: CreditCard },
  { title: "SMS", url: "/admin/settings/sms", icon: MessageSquare },
];

export function AdminSidebar() {
  const [location, navigate] = useLocation();
  const { logout } = useAuth();
  const { settings } = useSiteSettings();
  
  const siteName = settings?.siteName || "Lemoincher";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg">{siteName}</span>
            <p className="text-xs text-muted-foreground">Administration</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-admin-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Paramètres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-admin-settings-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <Link href="/">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Store className="h-4 w-4 mr-2" />
              Voir la boutique
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            size="sm"
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
