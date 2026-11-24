import { id, type Dict } from './id';
import { en } from './en';

export type Lang = 'id' | 'en';
export const LANGS: Lang[] = ['id', 'en'];
export const DEFAULT_LANG: Lang = 'id';

const dict: Record<Lang, Dict> = { id, en };

/** Kamus untuk satu bahasa. Bahasa tak dikenal jatuh ke bahasa Indonesia. */
export const t = (lang?: string): Dict => dict[lang === 'en' ? 'en' : 'id'];
