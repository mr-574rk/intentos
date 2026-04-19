import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { pt } from "./locales/pt";
import { zh } from "./locales/zh";

export type Locale = "en" | "es" | "fr" | "pt" | "zh";

export const LOCALES: { code: Locale; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "pt", flag: "🇧🇷", label: "Português" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
];

const translations: Record<Locale, Record<string, string>> = { en, es, fr, pt, zh };

export function getTranslation(locale: Locale, key: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (translations[locale] as any)[key] || (translations["en"] as any)[key] || key;
}
