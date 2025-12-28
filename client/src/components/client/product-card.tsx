import { ShoppingCart, Eye, Settings2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductWithCategory } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: ProductWithCategory;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const isVariable = product.productType === "variable";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isVariable) {
      navigate(`/product/${product.id}`);
      return;
    }
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter au panier",
        variant: "destructive",
      });
      return;
    }

    await addToCart(product);
    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté au panier`,
    });
  };

  const price = parseFloat(product.price);
  const stock = product.stock || 0;
  const isOutOfStock = stock === 0 && !isVariable;
  const mainImage = product.images?.[0] || "https://placehold.co/400x400/f3f4f6/9ca3af?text=Produit";

  return (
    <Card className="group overflow-visible" data-testid={`card-product-${product.id}`}>
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <img
            src={mainImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="destructive" className="text-sm">Rupture de stock</Badge>
            </div>
          )}
          {product.category && (
            <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
              {product.category.name}
            </Badge>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
            <Button size="icon" variant="secondary" className="h-10 w-10" data-testid={`button-view-${product.id}`}>
              <Eye className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 p-4 pt-0">
        <div>
          <p className="text-xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
            {price.toLocaleString("fr-FR")} F
          </p>
          {stock > 0 && stock <= 5 && (
            <p className="text-xs text-muted-foreground">
              Plus que {stock} en stock
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          data-testid={`button-add-cart-${product.id}`}
        >
          {isVariable ? (
            <>
              <Settings2 className="h-4 w-4 mr-1" />
              Choix des options
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-1" />
              Ajouter au panier
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
