import { Result } from '.';
import state from './state';

export const highlight = (s: Required<{ toString(): void }>): string => `\x1b[36m${s}\x1b[0m`;

export const formatUrl = (url: string): string =>
  ['http://', 'https://'].some((protocol) => url.startsWith(protocol)) ? url : `http://${url}`;

export const formatSingleResult = (name: string | undefined, content: string, includeName: boolean): string => {
  if (!name && includeName) throw new Error('No name to include in formatted result');
  return (includeName ? `${highlight(name as string)}: ${content?.trim()}` : content?.trim()) ?? '';
};

export const formatResults = (result: Result): string => {
  const entries = Object.entries(result);
  return entries.map(([name, content]) => formatSingleResult(name, content, entries.length > 1)).join('\n');
};

/**
 * Careful, only appends 's' for the moment
 */
export const plural = (s: string, n: number): string => (n > 1 ? `${s}s` : s);

export const typedKeys = <T>(obj: T): Array<keyof T> => Object.keys(obj) as Array<keyof T>;

type Entry<T> = [keyof T, T[keyof T]];

export const typedEntries = <T>(obj: T): Entry<T>[] => Object.entries(obj) as Entry<T>[];

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const hasTruthyValue = ([_, value]: Entry<any>): boolean => !!value;

/**
 * @returns Shallow copy which only includes the properties which match the predicate. Check for truthy values by default.
 */
export const filterProps = <T>(obj: T, predicate: (entry: Entry<T>) => boolean = hasTruthyValue): Partial<T> =>
  Object.fromEntries(typedEntries(obj).filter(predicate)) as Partial<T>;

export const splitByFilter = <T>(ar: T[], predicate: (elem: T) => boolean): [T[], T[]] =>
  ar.reduce(
    (split, elem) => {
      split[predicate(elem) ? 0 : 1].push(elem);
      return split;
    },
    [[], []] as [T[], T[]]
  );

export const printIfVerbose = {
  stdout: (message: string): void => {
    state.verbose && console.log(message);
  },
  stderr: (message: string): void => {
    state.verbose && console.error(message);
  },
};
