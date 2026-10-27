import { createHmac } from "crypto";
export const MAX_CHOICES = 3;
const UUID = /^[0-9a-f-]{36}$/i;
export function validateChoices(c: unknown): string[] | null {
  if (!Array.isArray(c) || c.length < 1 || c.length > MAX_CHOICES) return null;
  if (!c.every((x) => typeof x === "string" && UUID.test(x))) return null;
  return new Set(c).size === c.length ? (c as string[]) : null;
}
export const voterKey = (id: string, secret: string) => createHmac("sha256", secret).update(id).digest("hex");
export const normalizeCode = (s: unknown) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem I, L, O, 0, 1
