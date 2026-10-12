import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { es } from './es';

// Add a language here (and its file) and nothing else needs to change.
const i18n = new I18n({ es });

// Use the phone's language when we have it; otherwise Spanish.
i18n.defaultLocale = 'es';
i18n.locale = getLocales()[0]?.languageCode ?? 'es';
i18n.enableFallback = true;

export const t = (key: string, options?: Record<string, string | number>) =>
  i18n.t(key, options);
