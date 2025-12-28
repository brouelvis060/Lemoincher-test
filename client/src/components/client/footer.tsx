import { Link } from "wouter";
import { Package, Phone, Mail, MapPin } from "lucide-react";
import { useSiteSettings } from "@/lib/site-settings";

export function ClientFooter() {
  const { settings } = useSiteSettings();
  
  const siteName = settings?.siteName || "Lemoincher";
  const phone = settings?.phone || "+225 07 00 00 00 00";
  const email = settings?.email || "infos@lemoincher.com";
  const address = settings?.address || "Abidjan, Côte d'Ivoire";

  return (
    <footer className="border-t bg-card">
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">{siteName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre destination shopping en ligne en Afrique. Livraison rapide et paiement Mobile Money.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Accueil
              </Link>
              <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Produits
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                À propos
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Légal</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Conditions générales
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Politique de confidentialité
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
