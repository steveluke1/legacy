import { describe, expect, it } from "vitest";

import { siteConfig } from "@/lib/site-config";

describe("siteConfig", () => {
  it("exposes the legacy-inspired main navigation", () => {
    expect(siteConfig.name).toBe("Cabal Legacy");
    expect(siteConfig.navigation).toHaveLength(8);
    expect(siteConfig.navigation[0]?.href).toBe("/");
    expect(siteConfig.navigation[1]?.href).toBe("/rankings");
    expect(siteConfig.navigation[2]?.available).toBe(true);
    expect(siteConfig.navigation[3]?.highlight).toBe(true);
    expect(siteConfig.navigation[6]?.href).toBe("/mercado");
  });
});
