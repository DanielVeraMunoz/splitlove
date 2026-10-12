import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { es, type Translations } from './es';

// Add a language here (and its file) and nothing else needs to change.
const i18n = new I18n({ es });

// Use the phone's language when we have it; otherwise Spanish.
i18n.defaultLocale = 'es';
i18n.locale = getLocales()[0]?.languageCode ?? 'es';
i18n.enableFallback = true;

// Every dotted path that ends in a text, e.g. 'groups.empty' | 'groups.kinds.couple'
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<Translations>;

type Options = Record<string, string | number>;

export const t = (key: TranslationKey, options?: Options) => i18n.t(key, options);
