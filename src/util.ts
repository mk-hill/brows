import { TaggedVars, formatMessage, Color } from './stdio';

export const error = (rawStrings: TemplateStringsArray, ...variables: TaggedVars): Error =>
  new Error(formatMessage(rawStrings, ...variables, Color.RED));

export const formatUrl = (url: string): string => {
  return ['http://', 'https://'].some((protocol) => url.startsWith(protocol)) ? url : `http://${url}`;
};

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

/**
 * @returns Array of arrays: items matching predicate followed by remaining items
 */
export const splitByFilter = <T>(ar: T[], predicate: (elem: T) => boolean): [T[], T[]] => {
  return ar.reduce(
    (split, elem) => {
      split[predicate(elem) ? 0 : 1].push(elem);
      return split;
    },
    [[], []] as [T[], T[]]
  );
};
