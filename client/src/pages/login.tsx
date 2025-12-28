import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/lib/site-settings";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const siteName = settings?.siteName || "Lemoincher";
  
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get("redirect") || "/";

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Lemoincher !",
      });
      navigate(redirectUrl);
    } else {
      toast({
        title: "Erreur de connexion",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            {settings?.logo ? (
              <img 
                src={settings.logo} 
                alt={siteName} 
                className="h-10 w-auto max-w-[150px] object-contain"
                data-testid="img-login-logo"
              />
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold">{siteName}</span>
              </>
            )}
          </Link>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour continuer
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Votre mot de passe"
                          data-testid="input-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
                  Créer un compte
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
