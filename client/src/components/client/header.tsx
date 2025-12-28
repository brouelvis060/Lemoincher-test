import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, X, Package, LogOut, Home, Grid3X3, Phone, Trash2, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useSiteSettings } from "@/lib/site-settings";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/products", label: "Produits", icon: Grid3X3 },
  { href: "/contact", label: "Contact", icon: Phone },
];

export function ClientHeader() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { items, totalItems, subtotal, updateQuantity, removeFromCart } = useCart();
  const { settings } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const siteName = settings?.siteName || "Lemoincher";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {settings?.logo ? (
              <img 
                src={settings.logo} 
                alt={siteName} 
                className="h-9 w-auto max-w-[120px] object-contain"
                data-testid="img-logo"
              />
            ) : (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Package className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold hidden sm:inline-block" data-testid="text-logo">
                  {siteName}
                </span>
              </>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  <link.icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4"
              data-testid="input-search"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Popover open={cartOpen} onOpenChange={setCartOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Mon Panier</h3>
                <p className="text-sm text-muted-foreground">
                  {totalItems} article{totalItems > 1 ? "s" : ""}
                </p>
              </div>
              
              {items.length === 0 ? (
                <div className="p-6 text-center">
                  <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Votre panier est vide</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      setCartOpen(false);
                      navigate("/products");
                    }}
                  >
                    Voir les produits
                  </Button>
                </div>
              ) : (
                <>
                  <ScrollArea className="max-h-64">
                    <div className="p-2 space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3 p-2 rounded-md hover-elevate">
                          <img
                            src={item.product.images?.[0] || "https://placehold.co/60x60/f3f4f6/9ca3af?text=P"}
                            alt={item.product.name}
                            className="w-14 h-14 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                            <p className="text-sm text-primary font-semibold">
                              {parseFloat(item.product.price).toLocaleString("fr-FR")} F
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                disabled={(item.quantity || 1) <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm w-6 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-auto text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <Separator />
                  
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span className="font-semibold">{subtotal.toLocaleString("fr-FR")} F</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setCartOpen(false);
                          navigate("/cart");
                        }}
                      >
                        Voir le panier
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setCartOpen(false);
                          navigate("/checkout");
                        }}
                      >
                        Commander
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage || undefined} />
                    <AvatarFallback className="text-xs">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer" data-testid="link-profile">
                    <User className="mr-2 h-4 w-4" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="cursor-pointer" data-testid="link-orders">
                    <Package className="mr-2 h-4 w-4" />
                    Mes commandes
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer" data-testid="link-admin">
                        <Grid3X3 className="mr-2 h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive" data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="link-login">
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" data-testid="link-register">
                  Inscription
                </Button>
              </Link>
            </div>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4"
                    data-testid="input-search-mobile"
                  />
                </div>
              </form>
              <nav className="flex flex-col gap-2 mt-4">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={location === link.href ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      <link.icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
                {!user && (
                  <>
                    <hr className="my-2" />
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">
                        Inscription
                      </Button>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
