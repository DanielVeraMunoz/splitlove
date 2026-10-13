// Limits of the profile fields. The database enforces the same ones
// (supabase/migrations/..._profile_description_and_hardening.sql): keep both in sync.
export const NAME_MAX = 40;
export const DESCRIPTION_MAX = 140;

export type ProfileForm = { name: string; description: string };

// Cleans what the user typed and says whether it can be saved. An empty description is fine
// (it is stored as null); an empty name is not.
export function validateProfile(form: ProfileForm) {
  const name = form.name.trim();
  const description = form.description.trim();

  return {
    name,
    description: description === '' ? null : description,
    valid: name.length >= 1 && name.length <= NAME_MAX && description.length <= DESCRIPTION_MAX,
  };
}
