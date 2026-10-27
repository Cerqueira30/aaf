import { describe, it, expect } from "vitest";
import { validateChoices, voterKey } from "../src/lib/validate";
const a = "11111111-1111-1111-1111-111111111111", b = "22222222-2222-2222-2222-222222222222", c = "33333333-3333-3333-3333-333333333333", d = "44444444-4444-4444-4444-444444444444";
describe("escolhas", () => {
  it("aceita 1 a 3 distintas", () => { expect(validateChoices([a])).toEqual([a]); expect(validateChoices([a, b, c])).toHaveLength(3); });
  it("recusa vazio, 4, duplicadas e não-UUID", () => {
    expect(validateChoices([])).toBeNull(); expect(validateChoices([a, b, c, d])).toBeNull();
    expect(validateChoices([a, a])).toBeNull(); expect(validateChoices(["x"])).toBeNull(); expect(validateChoices(a)).toBeNull();
  });
  it("chave do votante depende do segredo", () => { expect(voterKey("x", "s")).toBe(voterKey("x", "s")); expect(voterKey("x", "s")).not.toBe(voterKey("x", "t")); });
});
import { normalizeCode } from "../src/lib/validate";
describe("código", () => { it("normaliza", () => { expect(normalizeCode(" ab3d-k7mn ")).toBe("AB3DK7MN"); expect(normalizeCode(undefined)).toBe(""); }); });
