import { describe, expect, it } from "vitest";
import {
  formatOccurrenceEventDate,
  normalizeOccurrenceEventDate,
  parseOccurrenceEventDate,
} from "./occurrence-event-date";

describe("parseOccurrenceEventDate", () => {
  it("parses ISO dates without changing the calendar day", () => {
    expect(parseOccurrenceEventDate("2022-02-11")).toEqual({
      raw: "2022-02-11",
      display: "11/02/2022",
      iso: "2022-02-11",
      kind: "iso-date",
    });
  });

  it("parses ISO datetimes and keeps the encoded date", () => {
    expect(parseOccurrenceEventDate("2022-02-11T23:45:00Z")).toEqual({
      raw: "2022-02-11T23:45:00Z",
      display: "11/02/2022",
      iso: "2022-02-11",
      kind: "iso-datetime",
    });
  });

  it("can recover legacy day-first dates that were serialized as ambiguous ISO dates", () => {
    expect(
      parseOccurrenceEventDate("2022-11-10", {
        recoverLegacyDayFirstIsoDates: true,
      }),
    ).toEqual({
      raw: "2022-11-10",
      display: "11/10/2022",
      iso: "2022-10-11",
      kind: "iso-legacy-day-first",
    });
  });

  it("parses day-first slash datetimes from legacy measured-tree data", () => {
    expect(parseOccurrenceEventDate("30/10/22 12:09")).toEqual({
      raw: "30/10/22 12:09",
      display: "30/10/2022",
      iso: "2022-10-30",
      kind: "slash-day-first",
    });
  });

  it("parses unambiguous month-first slash dates", () => {
    expect(parseOccurrenceEventDate("03/15/2024")).toEqual({
      raw: "03/15/2024",
      display: "15/03/2024",
      iso: "2024-03-15",
      kind: "slash-month-first",
    });
  });

  it("keeps ambiguous slash dates display-only instead of guessing", () => {
    expect(parseOccurrenceEventDate("03/04/2024 10:30")).toEqual({
      raw: "03/04/2024 10:30",
      display: "03/04/2024",
      kind: "slash-ambiguous",
    });
  });

  it("parses plausible Excel serial dates", () => {
    expect(parseOccurrenceEventDate("44846.60625")).toEqual({
      raw: "44846.60625",
      display: "12/10/2022",
      iso: "2022-10-12",
      kind: "excel-serial",
    });
  });

  it("returns null for invalid values", () => {
    expect(parseOccurrenceEventDate("not-a-date")).toBeNull();
  });
});

describe("normalizeOccurrenceEventDate", () => {
  it("returns canonical ISO dates for supported formats", () => {
    expect(normalizeOccurrenceEventDate("30/10/22 12:09")).toBe("2022-10-30");
    expect(normalizeOccurrenceEventDate("2024")).toBe("2024");
  });

  it("can swap ambiguous ISO month/day pairs for legacy day-first datasets", () => {
    expect(
      normalizeOccurrenceEventDate("2022-11-10", {
        recoverLegacyDayFirstIsoDates: true,
      }),
    ).toBe("2022-10-11");
  });

  it("returns null for ambiguous slash dates", () => {
    expect(normalizeOccurrenceEventDate("03/04/2024")).toBeNull();
  });
});

describe("formatOccurrenceEventDate", () => {
  it("formats supported dates for UI display", () => {
    expect(formatOccurrenceEventDate("30/10/22 12:09")).toBe("30/10/2022");
  });

  it("can format recovered legacy ISO dates in dd/mm/yyyy order", () => {
    expect(
      formatOccurrenceEventDate("2022-11-10", {
        recoverLegacyDayFirstIsoDates: true,
      }),
    ).toBe("11/10/2022");
  });

  it("falls back to unknown for invalid values", () => {
    expect(formatOccurrenceEventDate("not-a-date")).toBe("unknown");
  });
});
