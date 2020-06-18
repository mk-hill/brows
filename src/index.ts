import * as defaults from './defaults';
import { getContent, launchBrowser } from './getContent';
import { buildOptions as buildTargets } from './targets';
import { splitOptions, Options } from './options';

export { launchBrowser, closeBrowser } from './getContent';

export type Result<T extends string> = Record<T | typeof defaults['targetName'], string>;

/**
 * Retrieve content from target(s)
 * @param input array containing either one url followed by one selector, or any number of saved target names
 * @param options optional options object
 * @returns promise which resolves to an object with names (or 'content' for anonymous targets) as keys and results as values
 */
export default async function brows<T extends string>(input: T[], options: Partial<Options> = {}): Promise<Result<T>> {
  const [runOptions, targetOptions] = splitOptions({ ...defaults.options, ...options });

  const targets = await buildTargets(input, targetOptions, runOptions);

  // Launch browser in advance if any targets are known to require it
  if (targets.some(({ forceBrowser }) => forceBrowser)) {
    launchBrowser(runOptions.verbose);
  }

  const results = await Promise.all(
    targets.map(async (target) => ({
      name: target.name,
      content: await getContent(target),
    }))
  );

  return results.reduce((result, { name, content }) => ({ ...result, [name || defaults.targetName]: content }), {} as Result<T>);
}
