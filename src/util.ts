import pretty from 'pretty';

import state from './state';
import { GetContentResult } from './getContent';

export const highlight = (s: Required<{ toString(): void }>): string => `\x1b[36m${s}\x1b[0m`;

export const formatUrl = (url: string): string => {
  return ['http://', 'https://'].some((protocol) => url.startsWith(protocol)) ? url : `http://${url}`;
};

const formatContent = (result: GetContentResult, indent = 0, isFirstElement = true): string => {
  const { content, delim } = result;
  if (!Array.isArray(content)) {
    return (
      pretty(content, { ocd: true })
        .split('\n')
        // indent every line except the first line of the first element's content
        .map((line, i) => ' '.repeat(isFirstElement && !i ? 0 : indent) + line)
        .filter((line) => line.trim())
        .join('\n')
    );
  }

  const indentEachResult = delim.includes('\n') ? indent : 0;

  return content
    .filter((singleElementContent) => singleElementContent.trim())
    .map((s, i) => formatContent({ ...result, content: s }, indentEachResult, i === 0))
    .join(delim);
};

export const formatTargetResult = (result: GetContentResult, includeName: boolean): string => {
  const { name } = result;
  if (!name && includeName) throw new Error('No name to include in formatted result');
  let prefix = '';
  let indent = 0;

  if (includeName) {
    const s = ': ';
    prefix = highlight(name as string) + s;
    indent = (name?.length ?? 0) + s.length;
  }

  const formattedContent = formatContent(result, indent);

  return (prefix + formattedContent).trim();
};

export const formatAllResults = (results: GetContentResult[]): string =>
  results.map((result) => formatTargetResult(result, results.length > 1)).join('\n');

/**
 * Careful, only appends 's' and handles '-y' -> '-ies' for the moment
 */
export const plural = (s: string, n: number): string => {
  if (n === 1) return s;
  return s.endsWith('y') ? `${s.slice(0, -1)}ies` : `${s}s`;
};

export const typedKeys = <T>(obj: T): Array<keyof T> => Object.keys(obj) as Array<keyof T>;

type Entry<T> = [keyof T, T[keyof T]];

export const typedEntries = <T>(obj: T): Entry<T>[] => Object.entries(obj) as Entry<T>[];

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const hasTruthyValue = ([_, value]: Entry<any>): boolean => !!value;

/**
 * @returns Shallow copy which only includes the properties which match the predicate. Check for truthy values by default.
 */
export const filterProps = <T>(obj: T, predicate: (entry: Entry<T>) => boolean = hasTruthyValue): Partial<T> => {
  return Object.fromEntries(typedEntries(obj).filter(predicate)) as Partial<T>;
};

export const splitByFilter = <T>(ar: T[], predicate: (elem: T) => boolean): [T[], T[]] => {
  return ar.reduce(
    (split, elem) => {
      split[predicate(elem) ? 0 : 1].push(elem);
      return split;
    },
    [[], []] as [T[], T[]]
  );
};

export const printIfVerbose = {
  stdout: (message: string): void => {
    state.verbose && console.log(message);
  },
  stderr: (message: string): void => {
    state.verbose && console.error(message);
  },
};
