import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Image, FileText, Film, Music, Loader2, Upload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { MediaFile } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminMedia() {
  const { toast } = useToast();

  const { data: mediaFiles = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ["/api/media"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Fichier supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiée dans le presse-papiers" });
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (contentType.startsWith("video/")) return <Film className="w-4 h-4" />;
    if (contentType.startsWith("audio/")) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      for (const file of result.successful) {
        const uploadedFile = file.data as { objectPath?: string };
        const objectPath = uploadedFile?.objectPath || file.meta?.objectPath;
        
        if (objectPath) {
          const fullUrl = `${window.location.origin}${objectPath}`;
          await apiRequest("POST", "/api/media", {
            name: file.name,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            objectPath: objectPath,
            url: fullUrl,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Fichier(s) téléchargé(s) avec succès" });
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Médiathèque</h1>
          <p className="text-muted-foreground">Gérez vos fichiers médias (images, documents, etc.)</p>
        </div>
        <ObjectUploader
          maxNumberOfFiles={10}
          maxFileSize={20 * 1024 * 1024}
          onGetUploadParameters={handleGetUploadParameters}
          onComplete={handleUploadComplete}
        >
          <Upload className="w-4 h-4 mr-2" />
          Ajouter des fichiers
        </ObjectUploader>
      </div>

      {mediaFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun fichier</h3>
            <p className="text-muted-foreground text-center mb-4">
              Commencez par télécharger des fichiers pour votre site.
            </p>
            <ObjectUploader
              maxNumberOfFiles={10}
              maxFileSize={20 * 1024 * 1024}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter des fichiers
            </ObjectUploader>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {mediaFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden" data-testid={`card-media-${file.id}`}>
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {file.mimeType.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {getFileIcon(file.mimeType)}
                    <span className="text-xs uppercase">{file.mimeType.split("/")[1]}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                <p className="font-medium truncate text-xs sm:text-sm" title={file.originalName}>
                  {file.originalName}
                </p>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {formatFileSize(file.size)}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {file.createdAt && format(new Date(file.createdAt), "d MMM", { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(file.url)}
                    data-testid={`button-copy-url-${file.id}`}
                    className="h-7 w-7 sm:h-8 sm:w-auto sm:px-3"
                  >
                    <Copy className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Copier</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${file.id}`}
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
