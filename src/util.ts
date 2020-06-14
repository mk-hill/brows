export const highlight = (s: string) => `\x1b[36m${s}\x1b[0m`;

export const formatUrl = (url: string) => (['http://', 'https://'].some((protocol) => url.startsWith(protocol)) ? url : `http://${url}`);

export const formatResults = (results: { name?: string; content: string }[]) => {
  if (results.length === 1) return results[0].content.trim();
  return results.map(({ name, content }) => (name ? `${highlight(name)}: ${content}` : content)).join('\n');
};

export const printIf = (condition: boolean | undefined) => ({
  stdout: (message: string) => condition && console.log(message),
  stderr: (message: string) => condition && console.error(message),
});
