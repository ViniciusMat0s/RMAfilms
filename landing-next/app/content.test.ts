import { describe, expect, it } from "vitest";

import {
  capabilities,
  footerLegalLinks,
  footerLinkColumns,
  navSections,
  process,
  projects,
  teamMembers,
} from "./content";

describe("content contract", () => {
  it("keeps core sections populated", () => {
    expect(capabilities.length).toBe(4);
    expect(projects.length).toBeGreaterThanOrEqual(8);
    expect(process.length).toBe(4);
    expect(teamMembers.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps navigation sections unique", () => {
    const ids = navSections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps process steps ordered", () => {
    expect(process.map((step) => step.step)).toEqual(["01", "02", "03", "04"]);
  });

  it("keeps footer columns and links valid", () => {
    expect(footerLinkColumns).toHaveLength(4);

    footerLinkColumns.forEach((column) => {
      expect(column.title.trim().length).toBeGreaterThan(0);
      expect(column.links.length).toBeGreaterThan(0);
      column.links.forEach((link) => {
        expect(link.label.trim().length).toBeGreaterThan(0);
        expect(link.href.trim().length).toBeGreaterThan(0);
      });
    });

    expect(footerLegalLinks).toHaveLength(2);
  });
});
