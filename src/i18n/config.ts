import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export function initI18n(locale = 'en') {
  return i18n.use(initReactI18next).init({
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: {
        translation: {
          'app.title': 'Sovereign Dominion',
          'app.tagline': 'Your word, built.',
          'hud.blocks': '{{count}} blocks needed',
          'hud.violations': '{{count}} compliance issue(s)',
          'panel.materials': 'Materials',
          'panel.search': 'Search materials...',
          'panel.loading': 'Loading…',
          'panel.empty': 'No results found.',
          'esther.ready': 'Esther ready. Speak your design.',
          'esther.wall.added': 'Wall added. {{blocks}} blocks needed.',
          'esther.warning': 'Warning: {{message}}',
        },
      },
      es: {
        translation: {
          'app.title': 'Dominion Soberano',
          'app.tagline': 'Tu palabra, construida.',
          'hud.blocks': '{{count}} bloques necesarios',
          'esther.ready': 'Esther lista. Habla tu diseño.',
        },
      },
    },
  });
}
