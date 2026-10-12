// Must match the group_kind enum in supabase/schema.sql
export type GroupKind = 'couple' | 'flatmates' | 'throuple' | 'family' | 'lovers' | 'other';

export const GROUP_KINDS: { value: GroupKind; label: string }[] = [
  { value: 'couple', label: 'Couple' },
  { value: 'flatmates', label: 'Flatmates' },
  { value: 'throuple', label: 'Throuple' },
  { value: 'family', label: 'Family' },
  { value: 'lovers', label: 'Lovers' },
  { value: 'other', label: 'Other' },
];

export type Group = {
  id: string;
  name: string;
  kind: GroupKind;
};
