"use client";

import { useState } from "react";
import Papa from "papaparse";

type CsvParserState = {
  parsedData: Record<string, string>[] | null;
  headers: string[] | null;
  rowCount: number;
  error: string | null;
  isParsing: boolean;
};

const initialState: CsvParserState = {
  parsedData: null,
  headers: null,
  rowCount: 0,
  error: null,
  isParsing: false,
};

type UseCsvParserReturn = CsvParserState & {
  parseFile: (file: File) => Promise<void>;
  reset: () => void;
};

export function useCsvParser(): UseCsvParserReturn {
  const [state, setState] = useState<CsvParserState>(initialState);

  const parseFile = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      setState((prev) => ({ ...prev, isParsing: true, error: null }));

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        encoding: "UTF-8",
        complete(results) {
          if (results.data.length === 0 && (!results.meta.fields || results.meta.fields.length === 0)) {
            setState({
              parsedData: null,
              headers: null,
              rowCount: 0,
              error: "File is empty",
              isParsing: false,
            });
            resolve();
            return;
          }

          const headers = results.meta.fields ?? [];
          const parsedData = results.data as Record<string, string>[];

          setState({
            parsedData,
            headers,
            rowCount: parsedData.length,
            error: null,
            isParsing: false,
          });
          resolve();
        },
        error(err) {
          setState({
            parsedData: null,
            headers: null,
            rowCount: 0,
            error: err.message,
            isParsing: false,
          });
          resolve();
        },
      });
    });
  };

  const reset = () => {
    setState(initialState);
  };

  return {
    ...state,
    parseFile,
    reset,
  };
}
