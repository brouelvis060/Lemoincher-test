import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Save, GripVertical, Image, Link2, Upload, Settings, Clock, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { SiteSettings } from "@shared/schema";

interface Banner {
  image: string;
  link?: string;
  title?: string;
}

interface CarouselSettings {
  interval: number;
  height: string;
  autoPlay: boolean;
  showArrows: boolean;
  showDots: boolean;
}

const defaultCarouselSettings: CarouselSettings = {
  interval: 5000,
  height: "medium",
  autoPlay: true,
  showArrows: true,
  showDots: true,
};

export default function AdminHomepageSettings() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [carouselSettings, setCarouselSettings] = useState<CarouselSettings>(defaultCarouselSettings);

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings/site"],
  });

  useEffect(() => {
    if (settings?.homeBanners) {
      setBanners(settings.homeBanners as Banner[]);
    }
    if (settings?.carouselSettings) {
      setCarouselSettings({ ...defaultCarouselSettings, ...(settings.carouselSettings as CarouselSettings) });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { homeBanners: Banner[]; carouselSettings: CarouselSettings }) => {
      const response = await apiRequest("PATCH", "/api/settings/site", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/site"] });
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres de la page d'accueil ont été mis à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres",
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
    saveMutation.mutate({ homeBanners: validBanners, carouselSettings });
  };

  const handleGetUploadParameters = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await response.json();
    file.meta = { ...file.meta, objectPath: data.objectPath };

    return {
      method: "PUT" as const,
      url: data.uploadURL,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    };
  };

  const handleUploadComplete = (index: number) => async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      const uploadedFile = file.data as { objectPath?: string };
      const objectPath = uploadedFile?.objectPath || file.meta?.objectPath;
      
      if (objectPath) {
        const fullUrl = `${window.location.origin}${objectPath}`;
        updateBanner(index, "image", fullUrl);
        toast({ title: "Image téléchargée avec succès" });
      }
    }
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
            <Settings className="h-5 w-5" />
            Paramètres du carrousel
          </CardTitle>
          <CardDescription>
            Configurez le comportement et l'apparence du carrousel de bannières
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="carousel-interval" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Durée d'affichage (secondes)
              </Label>
              <Select
                value={String(carouselSettings.interval / 1000)}
                onValueChange={(value) => setCarouselSettings({ ...carouselSettings, interval: Number(value) * 1000 })}
              >
                <SelectTrigger id="carousel-interval" data-testid="select-carousel-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 secondes</SelectItem>
                  <SelectItem value="5">5 secondes</SelectItem>
                  <SelectItem value="7">7 secondes</SelectItem>
                  <SelectItem value="10">10 secondes</SelectItem>
                  <SelectItem value="15">15 secondes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carousel-height" className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Taille du carrousel
              </Label>
              <Select
                value={carouselSettings.height}
                onValueChange={(value) => setCarouselSettings({ ...carouselSettings, height: value })}
              >
                <SelectTrigger id="carousel-height" data-testid="select-carousel-height">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petit (250px)</SelectItem>
                  <SelectItem value="medium">Moyen (400px)</SelectItem>
                  <SelectItem value="large">Grand (500px)</SelectItem>
                  <SelectItem value="xlarge">Très grand (600px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Défilement automatique</Label>
                <p className="text-sm text-muted-foreground">Les bannières défilent automatiquement</p>
              </div>
              <Switch
                checked={carouselSettings.autoPlay}
                onCheckedChange={(checked) => setCarouselSettings({ ...carouselSettings, autoPlay: checked })}
                data-testid="switch-autoplay"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Afficher les flèches</Label>
                <p className="text-sm text-muted-foreground">Flèches de navigation gauche/droite</p>
              </div>
              <Switch
                checked={carouselSettings.showArrows}
                onCheckedChange={(checked) => setCarouselSettings({ ...carouselSettings, showArrows: checked })}
                data-testid="switch-arrows"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Afficher les indicateurs</Label>
                <p className="text-sm text-muted-foreground">Points de navigation en bas</p>
              </div>
              <Switch
                checked={carouselSettings.showDots}
                onCheckedChange={(checked) => setCarouselSettings({ ...carouselSettings, showDots: checked })}
                data-testid="switch-dots"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                        
                        <div className="space-y-2">
                          <Label>Image de la bannière *</Label>
                          <div className="flex items-center gap-2">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={10 * 1024 * 1024}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={handleUploadComplete(index)}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {banner.image ? "Changer l'image" : "Télécharger une image"}
                            </ObjectUploader>
                            {banner.image && (
                              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                Image téléchargée
                              </span>
                            )}
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
        {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
      </Button>
    </div>
  );
}
