import { Result } from '.';

export const highlight = (s: string): string => `\x1b[36m${s}\x1b[0m`;

export const formatUrl = (url: string): string =>
  ['http://', 'https://'].some((protocol) => url.startsWith(protocol)) ? url : `http://${url}`;

export const formatResult = (result: Result<string>): string => {
  const entries = Object.entries(result);
  if (entries.length < 2) return entries[0]?.[1] ?? '';
  return entries.map(([name, content]) => (name ? `${highlight(name)}: ${content}` : content)).join('\n');
};

interface Print {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

export const printIf = (condition: boolean | undefined): Print => ({
  stdout: (message: string) => condition && console.log(message),
  stderr: (message: string) => condition && console.error(message),
});
