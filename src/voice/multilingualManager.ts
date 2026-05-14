const SUPPORTED_LOCALES = ['en-US', 'es-MX', 'pt-BR', 'fr-FR', 'de-DE', 'zh-CN', 'ja-JP', 'ko-KR', 'hi-IN', 'ar-SA'];

export class MultilingualManager {
  private currentLocale: string;
  private translations: Map<string, Record<string, string>> = new Map();

  constructor(defaultLocale = 'en-US') {
    this.currentLocale = SUPPORTED_LOCALES.includes(defaultLocale) ? defaultLocale : 'en-US';
  }

  async loadLocale(locale: string) {
    if (this.translations.has(locale)) return;
    try {
      const mod = await import(`../i18n/${locale}.json`);
      this.translations.set(locale, mod.default);
    } catch {
      console.warn(`Locale ${locale} not found, falling back to en-US`);
    }
  }

  setLocale(locale: string) {
    if (SUPPORTED_LOCALES.includes(locale)) this.currentLocale = locale;
  }

  t(key: string, fallback = key): string {
    const dict = this.translations.get(this.currentLocale);
    return dict?.[key] ?? fallback;
  }

  getLocale() { return this.currentLocale; }
  getSupportedLocales() { return [...SUPPORTED_LOCALES]; }
}
