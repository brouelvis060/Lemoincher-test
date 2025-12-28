import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface SiteSettings {
  siteName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  email: string;
  address: string;
  aboutPage: string;
  contactPage: string;
  termsPage: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: null,
  isLoading: true,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings/site"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return (
    <SiteSettingsContext.Provider value={{ settings: settings || null, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
