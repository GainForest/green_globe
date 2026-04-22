const YEAR_ONLY_PATTERN = /^\d{4}$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ])(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;
const SLASH_DATE_PATTERN =
  /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

const EXCEL_EPOCH_OFFSET_DAYS = 25569;
const MILLISECONDS_PER_DAY = 86_400_000;
const MIN_EXCEL_SERIAL = 20_000;
const MAX_EXCEL_SERIAL = 80_000;

type SlashDateOrder = "day-first" | "month-first" | "ambiguous";

export type OccurrenceEventDateOptions = {
  recoverLegacyDayFirstIsoDates?: boolean;
};

export type ParsedOccurrenceEventDate = {
  raw: string;
  display: string;
  iso?: string;
  kind:
    | "year"
    | "iso-date"
    | "iso-datetime"
    | "iso-legacy-day-first"
    | "slash-day-first"
    | "slash-month-first"
    | "slash-ambiguous"
    | "excel-serial";
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${pad2(month)}-${pad2(day)}`;

const toDisplayDate = (year: number, month: number, day: number) =>
  `${pad2(day)}/${pad2(month)}/${year}`;

const isValidDate = (year: number, month: number, day: number): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isValidTime = (
  hour: number,
  minute: number,
  second: number,
): boolean => {
  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    Number.isInteger(second) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59 &&
    second >= 0 &&
    second <= 59
  );
};

const expandTwoDigitYear = (year: number) =>
  year < 100 ? 2000 + year : year;

const maybeRecoverLegacyDayFirstIsoDate = (
  month: number,
  day: number,
  options?: OccurrenceEventDateOptions,
): { month: number; day: number; recovered: boolean } => {
  if (!options?.recoverLegacyDayFirstIsoDates || month > 12 || day > 12) {
    return { month, day, recovered: false };
  }

  return {
    month: day,
    day: month,
    recovered: month !== day,
  };
};

const inferSlashDateOrder = (
  first: number,
  second: number,
): SlashDateOrder | null => {
  if (first < 1 || second < 1 || first > 31 || second > 31) {
    return null;
  }

  if (first > 12 && second <= 12) {
    return "day-first";
  }

  if (second > 12 && first <= 12) {
    return "month-first";
  }

  if (first <= 12 && second <= 12) {
    return "ambiguous";
  }

  return null;
};

const parseExcelSerialDate = (raw: string): ParsedOccurrenceEventDate | null => {
  if (!/^\d+(?:\.\d+)?$/.test(raw)) {
    return null;
  }

  const serial = Number(raw);
  if (
    !Number.isFinite(serial) ||
    serial < MIN_EXCEL_SERIAL ||
    serial > MAX_EXCEL_SERIAL
  ) {
    return null;
  }

  const utcDate = new Date(
    Math.round((serial - EXCEL_EPOCH_OFFSET_DAYS) * MILLISECONDS_PER_DAY),
  );
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1;
  const day = utcDate.getUTCDate();

  if (!isValidDate(year, month, day)) {
    return null;
  }

  return {
    raw,
    display: toDisplayDate(year, month, day),
    iso: toIsoDate(year, month, day),
    kind: "excel-serial",
  };
};

export const parseOccurrenceEventDate = (
  rawValue: string | null | undefined,
  options?: OccurrenceEventDateOptions,
): ParsedOccurrenceEventDate | null => {
  if (typeof rawValue !== "string") {
    return null;
  }

  const raw = rawValue.trim();
  if (!raw) {
    return null;
  }

  if (YEAR_ONLY_PATTERN.test(raw)) {
    return {
      raw,
      display: raw,
      iso: raw,
      kind: "year",
    };
  }

  const isoDateMatch = raw.match(ISO_DATE_PATTERN);
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]);
    const day = Number(isoDateMatch[3]);
    const recoveredParts = maybeRecoverLegacyDayFirstIsoDate(
      month,
      day,
      options,
    );

    if (!isValidDate(year, recoveredParts.month, recoveredParts.day)) {
      return null;
    }

    return {
      raw,
      display: toDisplayDate(year, recoveredParts.month, recoveredParts.day),
      iso: toIsoDate(year, recoveredParts.month, recoveredParts.day),
      kind: recoveredParts.recovered ? "iso-legacy-day-first" : "iso-date",
    };
  }

  const isoDateTimeMatch = raw.match(ISO_DATE_TIME_PATTERN);
  if (isoDateTimeMatch) {
    const year = Number(isoDateTimeMatch[1]);
    const month = Number(isoDateTimeMatch[2]);
    const day = Number(isoDateTimeMatch[3]);
    const hour = Number(isoDateTimeMatch[4]);
    const minute = Number(isoDateTimeMatch[5]);
    const second = isoDateTimeMatch[6] ? Number(isoDateTimeMatch[6]) : 0;
    const recoveredParts = maybeRecoverLegacyDayFirstIsoDate(
      month,
      day,
      options,
    );

    if (
      !isValidDate(year, recoveredParts.month, recoveredParts.day) ||
      !isValidTime(hour, minute, second)
    ) {
      return null;
    }

    return {
      raw,
      display: toDisplayDate(year, recoveredParts.month, recoveredParts.day),
      iso: toIsoDate(year, recoveredParts.month, recoveredParts.day),
      kind: recoveredParts.recovered ? "iso-legacy-day-first" : "iso-datetime",
    };
  }

  const slashMatch = raw.match(SLASH_DATE_PATTERN);
  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const rawYear = Number(slashMatch[3]);
    const year = expandTwoDigitYear(rawYear);
    const order = inferSlashDateOrder(first, second);

    if (order === null) {
      return null;
    }

    if (order === "ambiguous") {
      return {
        raw,
        display: `${pad2(first)}/${pad2(second)}/${year}`,
        kind: "slash-ambiguous",
      };
    }

    const day = order === "day-first" ? first : second;
    const month = order === "day-first" ? second : first;

    if (!isValidDate(year, month, day)) {
      return null;
    }

    return {
      raw,
      display: toDisplayDate(year, month, day),
      iso: toIsoDate(year, month, day),
      kind: order === "day-first" ? "slash-day-first" : "slash-month-first",
    };
  }

  return parseExcelSerialDate(raw);
};

export const formatOccurrenceEventDate = (
  rawValue: string | null | undefined,
  options?: OccurrenceEventDateOptions,
): string => parseOccurrenceEventDate(rawValue, options)?.display ?? "unknown";

export const normalizeOccurrenceEventDate = (
  rawValue: string | null | undefined,
  options?: OccurrenceEventDateOptions,
): string | null => parseOccurrenceEventDate(rawValue, options)?.iso ?? null;
