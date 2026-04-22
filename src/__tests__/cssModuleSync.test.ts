/**
 * CSS module type declaration sync tests.
 * Guards against adding CSS classes without updating the corresponding .d.ts file,
 * which causes TypeScript type-check failures in CI.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "../..");

function cssClassNames(cssPath: string): string[] {
  const content = readFileSync(cssPath, "utf-8");
  const names = new Set<string>();
  for (const match of content.matchAll(/\.([a-zA-Z][a-zA-Z0-9]*)/g)) {
    names.add(match[1]);
  }
  return [...names].sort();
}

function dtsPropertyNames(dtsPath: string): string[] {
  const content = readFileSync(dtsPath, "utf-8");
  const names: string[] = [];
  for (const match of content.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*):\s*string;/gm)) {
    names.push(match[1]);
  }
  return names.sort();
}

describe("[G] CSS module type declaration sync", () => {
  it("[G] App.module.css.d.ts declares every class in App.module.css", () => {
    const cssClasses = cssClassNames(join(ROOT, "src/App.module.css"));
    const dtsProps = dtsPropertyNames(join(ROOT, "src/App.module.css.d.ts"));

    const missing = cssClasses.filter((c) => !dtsProps.includes(c));
    const extra = dtsProps.filter((p) => !cssClasses.includes(p));

    expect(missing, `Classes in CSS but missing from .d.ts: ${missing.join(", ")}`).toEqual([]);
    expect(extra, `Properties in .d.ts but not in CSS: ${extra.join(", ")}`).toEqual([]);
  });
});
