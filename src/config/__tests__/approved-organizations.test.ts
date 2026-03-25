import { describe, it, expect } from "vitest";
import { APPROVED_ORGANIZATION_DIDS } from "../approved-organizations";

describe("APPROVED_ORGANIZATION_DIDS", () => {
  it("contains exactly 37 organizations", () => {
    expect(APPROVED_ORGANIZATION_DIDS.size).toBe(37);
  });

  it("all entries are valid did:plc format", () => {
    for (const did of APPROVED_ORGANIZATION_DIDS) {
      expect(did).toMatch(/^did:plc:[a-z0-9]+$/);
    }
  });

  it("excludes VCS and non-approved organizations", () => {
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:wjsefeck45aivxyjfa5h43ay")).toBe(false); // VCS-875
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:wvf4a27l7mqaqprftbdxvoka")).toBe(false); // VCS-1715
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:6k3vbrlqjsmulckir7dkfpl7")).toBe(false); // VCS-981
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:m2q5zrgqlgxasxasbkxc7jnj")).toBe(false); // VCS-1382
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:qg2ochqstcoo5fgaubvhkpjj")).toBe(false); // VCS-1686
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:vxp4hnumhsq4frvlot2jxeg5")).toBe(false); // Nemus Project
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:hnq7o6bhbtvuljpr6osxwhcx")).toBe(false); // Kayapo Project
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:6vqdgzeocehvrkj4ekxurmzt")).toBe(false); // Wovoka, Inc.
  });

  it("includes known approved organizations", () => {
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:axibb3hd3od3635jhihwmohv")).toBe(true); // XPRIZE Rainforest Finals
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:defetgjrgdyywmt5aenegzez")).toBe(true); // Million Trees Project
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:mxcduncsqkh4ntykdbibdb7v")).toBe(true); // Masungi Georeserve Foundation
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:6oxtzu7gxz7xcldvtwfh3bpt")).toBe(true); // Oceanus Conservation
    expect(APPROVED_ORGANIZATION_DIDS.has("did:plc:ou7k32zbibd5f4tnzwjj42ck")).toBe(true); // Defensores del Chaco
  });

  it("contains no duplicate entries", () => {
    const allEntries = [...APPROVED_ORGANIZATION_DIDS];
    const uniqueEntries = new Set(allEntries);
    expect(uniqueEntries.size).toBe(allEntries.length);
  });
});
