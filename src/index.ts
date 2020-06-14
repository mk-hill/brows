import type { CLI } from './cli';

import { getContent, launchBrowser } from './getContent';
import { formatResults } from './util';
import { buildOptions } from './options';

export async function brows(cli: CLI): Promise<string> {
  const allOptions = await buildOptions(cli);

  // Launch browser in advance if any options are known to require it
  if (allOptions.some(({ forceBrowser }) => forceBrowser)) {
    launchBrowser(allOptions.some(({ verbose }) => verbose));
  }

  const results = await Promise.all(
    allOptions.map(async (options) => ({
      name: options.name,
      content: await getContent(options),
    }))
  );

  return formatResults(results);
}
