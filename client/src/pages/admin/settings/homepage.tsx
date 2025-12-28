import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Save, GripVertical, Image, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SiteSettings } from "@shared/schema";

interface Banner {
  image: string;
  link?: string;
  title?: string;
}

export default function AdminHomepageSettings() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings/site"],
  });

  useEffect(() => {
    if (settings?.homeBanners) {
      setBanners(settings.homeBanners as Banner[]);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { homeBanners: Banner[] }) => {
      const response = await apiRequest("PATCH", "/api/settings/site", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/site"] });
      toast({
        title: "Bannières enregistrées",
        description: "Les bannières de la page d'accueil ont été mises à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les bannières",
        variant: "destructive",
      });
    },
  });

  const addBanner = () => {
    setBanners([...banners, { image: "", link: "", title: "" }]);
  };

  const removeBanner = (index: number) => {
    setBanners(banners.filter((_, i) => i !== index));
  };

  const updateBanner = (index: number, field: keyof Banner, value: string) => {
    const updated = [...banners];
    updated[index] = { ...updated[index], [field]: value };
    setBanners(updated);
  };

  const moveBanner = (from: number, to: number) => {
    if (to < 0 || to >= banners.length) return;
    const updated = [...banners];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setBanners(updated);
  };

  const handleSave = () => {
    const validBanners = banners.filter(b => b.image.trim() !== "");
    saveMutation.mutate({ homeBanners: validBanners });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Paramètres de la page d'accueil</h1>
        <p className="text-muted-foreground">
          Gérez le carrousel de bannières affiché sur la page d'accueil
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Bannières du carrousel
          </CardTitle>
          <CardDescription>
            Ajoutez des images promotionnelles qui s'afficheront en diaporama sur la page d'accueil. 
            Dimensions recommandées: 1920x600 pixels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune bannière configurée</p>
              <p className="text-sm">Cliquez sur le bouton ci-dessous pour ajouter votre première bannière</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-1 mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => moveBanner(index, index - 1)}
                          disabled={index === 0}
                          data-testid={`button-move-up-${index}`}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          Bannière {index + 1}
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`banner-image-${index}`}>URL de l'image *</Label>
                            <div className="flex gap-2">
                              <Input
                                id={`banner-image-${index}`}
                                value={banner.image}
                                onChange={(e) => updateBanner(index, "image", e.target.value)}
                                placeholder="https://..."
                                data-testid={`input-banner-image-${index}`}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`banner-link-${index}`}>
                              <Link2 className="h-3 w-3 inline mr-1" />
                              Lien (optionnel)
                            </Label>
                            <Input
                              id={`banner-link-${index}`}
                              value={banner.link || ""}
                              onChange={(e) => updateBanner(index, "link", e.target.value)}
                              placeholder="/products ou https://..."
                              data-testid={`input-banner-link-${index}`}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`banner-title-${index}`}>Titre (optionnel, pour l'accessibilité)</Label>
                          <Input
                            id={`banner-title-${index}`}
                            value={banner.title || ""}
                            onChange={(e) => updateBanner(index, "title", e.target.value)}
                            placeholder="Description de la bannière"
                            data-testid={`input-banner-title-${index}`}
                          />
                        </div>

                        {banner.image && (
                          <div className="mt-4">
                            <img
                              src={banner.image}
                              alt={banner.title || `Bannière ${index + 1}`}
                              className="w-full max-h-48 object-cover rounded-md border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBanner(index)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-remove-banner-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addBanner}
            className="w-full"
            data-testid="button-add-banner"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une bannière
          </Button>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        disabled={saveMutation.isPending}
        data-testid="button-save"
      >
        <Save className="h-4 w-4 mr-2" />
        {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les bannières"}
      </Button>
    </div>
  );
}
