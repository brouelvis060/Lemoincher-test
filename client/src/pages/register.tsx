import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/lib/site-settings";

const registerSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  isWhatsappSameAsPhone: z.boolean(),
  whatsapp: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => data.isWhatsappSameAsPhone || (data.whatsapp && data.whatsapp.length >= 10), {
  message: "Numéro WhatsApp invalide",
  path: ["whatsapp"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const siteName = settings?.siteName || "Lemoincher";
  
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get("redirect") || "/";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      isWhatsappSameAsPhone: true,
      whatsapp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isWhatsappSame = form.watch("isWhatsappSameAsPhone");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    const result = await register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      whatsapp: data.isWhatsappSameAsPhone ? data.phone : data.whatsapp,
      isWhatsappSameAsPhone: data.isWhatsappSameAsPhone,
    });
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur Lemoincher !",
      });
      navigate(redirectUrl);
    } else {
      toast({
        title: "Erreur d'inscription",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            {settings?.logo ? (
              <img 
                src={settings.logo} 
                alt={siteName} 
                className="h-10 w-auto max-w-[150px] object-contain"
                data-testid="img-register-logo"
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
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous pour commencer vos achats
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" data-testid="input-firstname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Dupont" data-testid="input-lastname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+225 07 00 00 00 00"
                        data-testid="input-phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isWhatsappSameAsPhone"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-whatsapp-same"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mon numéro WhatsApp est le même</FormLabel>
                      <FormDescription>
                        Nous utilisons WhatsApp pour les notifications
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {!isWhatsappSame && (
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+225 07 00 00 00 00"
                          data-testid="input-whatsapp"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                          placeholder="Minimum 6 caractères"
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirmez votre mot de passe"
                        data-testid="input-confirm-password"
                        {...field}
                      />
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
                data-testid="button-register"
              >
                {isLoading ? "Inscription..." : "Créer mon compte"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Déjà un compte ?{" "}
                <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                  Se connecter
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
