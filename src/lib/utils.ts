import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toKebabCase = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
};

export const camelCaseToTitleCase = (input: string) => {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, function (str: string) {
      return str.toUpperCase();
    });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]>[] => {
  const groupedDataKeys: string[] = [];
  const groupedData = new Map<string, T[]>();

  array.forEach((item) => {
    const value = item[key];
    let valueStr: string;
    if (typeof value === "string") {
      valueStr = value;
    } else if (typeof value === "number") {
      valueStr = value.toString();
    } else {
      return;
    }

    if (groupedData.has(valueStr)) {
      groupedData.get(valueStr)?.push(item);
    } else {
      groupedData.set(valueStr, [item]);
      groupedDataKeys.push(valueStr);
    }
  });

  return groupedDataKeys.map((key) => ({
    [key]: groupedData.get(key),
  })) as Record<string, T[]>[];
};

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const verifyKeyType = <
  K extends string | number,
  T extends readonly K[]
>(
  key: unknown,
  allowedKeys: T
): key is T[number] => {
  if (allowedKeys.length === 0) return false;
  const firstAllowedKey = allowedKeys[0];
  if (typeof firstAllowedKey !== typeof key) return false;
  return Boolean(allowedKeys.find((k) => k === key));
};

export const isObject = (value: unknown): value is object => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof RegExp) &&
    !(value instanceof Date) &&
    !(value instanceof Set) &&
    !(value instanceof Map)
  );
};
