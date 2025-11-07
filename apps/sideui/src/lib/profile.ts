import type { Gender, LookingFor } from "@us/types";

export const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "woman", label: "Woman · She/Her" },
  { value: "man", label: "Man · He/Him" },
  { value: "nonbinary", label: "Non-binary · They/Them" },
  { value: "other", label: "Another gender" },
];

export const LOOKING_FOR_OPTIONS: Array<{ value: LookingFor; label: string }> = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "nonbinary", label: "They/Them" },
  { value: "everyone", label: "Everyone" },
];

export function getGenderLabel(value: Gender | null | undefined): string | null {
  if (!value) return null;
  const match = GENDER_OPTIONS.find((option) => option.value === value);
  return match ? match.label : value;
}

export function getLookingForLabel(value: LookingFor | null | undefined): string | null {
  if (!value) return null;
  const match = LOOKING_FOR_OPTIONS.find((option) => option.value === value);
  return match ? match.label : value;
}
