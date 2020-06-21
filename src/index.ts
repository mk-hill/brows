import * as defaults from './defaults';
import { getContent, launchBrowser, GetContentResult } from './getContent';
import { extractOptions, Options } from './options';
import { buildTargets, listSavedTargets, saveCurrentTargets } from './targets';
import { formatSingleResult } from './util';
import state, { init } from './state';
import { NamedTarget } from './targets/types';

export { launchBrowser, closeBrowser } from './getContent';

export type Input = (string | Partial<Options>)[];
export type Result = Record<string, string>;

/**
 * Retrieve content from target(s)
 * @param input Any number of strings optionally followed by an options object.
 * Strings can consist of either one url followed by one selector, or any number of saved target names.
 * @param options Optional options object.
 * @returns Promise which resolves to an object with each individual target's name (or 'content' for anonymous targets)
 * mapped to its result. Group names will not be included in the result.
 */
export default async function brows(...args: Input): Promise<Result> {
  const [input, targetOptions, runOptions] = extractOptions(args);
  const { listSaved, save, saveOnly } = init(runOptions);
  const ongoing: Promise<void>[] = [];

  if (listSaved) ongoing.push(listSavedTargets());

  let results: GetContentResult[] = [];

  if (input.length) {
    const targets = await buildTargets(input, targetOptions, runOptions);

    const name = save || saveOnly;
    if (name) ongoing.push(saveCurrentTargets(name, targets as NamedTarget[]));
    if (saveOnly) return {};

    // Launch browser in advance if any targets are known to require it
    if (targets.some(({ forceBrowser }) => forceBrowser)) launchBrowser();

    results = await Promise.all(
      targets.map((target) => getContent(target).then((result) => printIfAsyncAllowed(result, targets.length > 1)))
    );
  } else if (state.isInputRequired) {
    throw new Error('No input');
  }

  await Promise.allSettled(ongoing);

  return results.reduce((result, { name, content }) => ({ ...result, [name || defaults.targetName]: content }), {});
}

function printIfAsyncAllowed(result: GetContentResult, includeName: boolean) {
  if (!state.orderedPrint) {
    const { name, content } = result;
    console.log(formatSingleResult(name, content, includeName));
  }
  return result;
}
