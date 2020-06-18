import * as defaults from './defaults';
import { getContent, launchBrowser } from './getContent';
import { extractOptions, Options } from './options';
import { buildTargets } from './targets';

export { launchBrowser, closeBrowser } from './getContent';

export type Input = (string | Partial<Options>)[];
export type Result = Record<string, string>;

/**
 * Retrieve content from target(s)
 * @param input Any number of strings optionally followed by an options object.
 * Strings can consist of either one url followed by one selector, or any number of saved target names.
 * @param options Optional options object.
 * @returns Promise which resolves to an object with each individual target's name (or 'content' for anonymous targets)
 * mapped to its result. Parent names will not be included in the result.
 */
export default async function brows(...args: Input): Promise<Result> {
  const [input, targetOptions, runOptions] = extractOptions(args);

  const targets = await buildTargets(input, targetOptions, runOptions);

  // Launch browser in advance if any targets are known to require it
  if (targets.some(({ forceBrowser }) => forceBrowser)) {
    launchBrowser(runOptions.verbose);
  }

  const results = await Promise.all(
    targets.map(async (target) => ({
      name: target.name,
      content: await getContent(target, runOptions),
    }))
  );

  return results.reduce((result, { name, content }) => ({ ...result, [name || defaults.targetName]: content }), {});
}
