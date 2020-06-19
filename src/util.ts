import { Result } from '.';

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
 * Careful, only adds s for the moment
 */
export const plural = (s: string, n: number): string => (n > 1 ? `${s}s` : s);

interface Print {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

export const printIf = (condition: boolean | undefined): Print => ({
  stdout: (message: string) => condition && console.log(message),
  stderr: (message: string) => condition && console.error(message),
});
