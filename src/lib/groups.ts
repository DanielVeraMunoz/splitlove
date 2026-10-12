// Must match the group_kind enum in supabase/schema.sql
export type GroupKind = 'couple' | 'flatmates' | 'throuple' | 'family' | 'lovers' | 'other';

export const GROUP_KINDS: GroupKind[] = [
  'couple',
  'flatmates',
  'throuple',
  'family',
  'lovers',
  'other',
];

export type Group = {
  id: string;
  name: string;
  kind: GroupKind;
  invite_code: string;
};
