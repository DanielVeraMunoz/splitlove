// What one action can be worth. The database enforces the same range
// (supabase/migrations/..._entries_points_range.sql): keep both in sync.
export const POINT_OPTIONS = [1, 2, 3] as const;

export type Points = (typeof POINT_OPTIONS)[number];
