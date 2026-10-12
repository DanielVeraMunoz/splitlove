import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { es, type Translations } from './es';

// Add a language here (and its file) and nothing else needs to change.
const translations = { es };
const i18n = new I18n(translations);

// Use the phone's language only if we have a translation for it; otherwise Spanish.
// (If we kept an unsupported one like 'en', texts would be Spanish but dates English.)
const deviceLanguage = getLocales()[0]?.languageCode;
i18n.defaultLocale = 'es';
i18n.locale = deviceLanguage && deviceLanguage in translations ? deviceLanguage : 'es';
i18n.enableFallback = true;

// Every dotted path that ends in a text, e.g. 'groups.empty' | 'groups.kinds.couple'
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

// Also used to format dates in the same language as the texts
export const locale = i18n.locale;

export type TranslationKey = Leaves<Translations>;

type Options = Record<string, string | number>;

export const t = (key: TranslationKey, options?: Options) => i18n.t(key, options);
