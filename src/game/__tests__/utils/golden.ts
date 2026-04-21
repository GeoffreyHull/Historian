import { it } from "vitest";

export function golden(name: string, fn: () => void | Promise<void>) {
  return it(`[G] ${name}`, fn);
}
