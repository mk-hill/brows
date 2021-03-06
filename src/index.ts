import * as defaults from './defaults';
import { getContent, launchBrowser, GetContentResult } from './getContent';
import { extractOptions, Options } from './options';
import { buildTargets, listSavedTargets, importAllFromFile, exportAllSaved, NamedTarget, confirmAndSave } from './targets';
import { printResult, printAllResults } from './stdio';
import state, { init } from './state';
import { error } from './util';

export { launchBrowser, closeBrowser } from './getContent';

export type Input = (string | Partial<Options>)[];
export type Result = Record<string, string | string[]>;

/**
 * Retrieve content from target(s)
 * @param args Any number of strings optionally followed by an options object.
 * Strings can consist of either one url followed by one selector, or any number of saved target names.
 * @returns Promise which resolves to an object with each individual target's name (or 'content' for anonymous targets)
 * mapped to its result. Group names will not be included in the result.
 */
export default async function brows(...args: Input): Promise<Result> {
  const [input, targetOptions, runOptions] = extractOptions(args);
  const { listSaved, save, saveOnly, import: importTarget, export: exportTarget, orderedPrint } = init(runOptions);
  const ongoing: Promise<void>[] = [];

  // TODO list/import/save at start only if not saving
  if (listSaved) ongoing.push(listSavedTargets());
  if (importTarget) ongoing.push(importAllFromFile(importTarget));
  if (exportTarget) ongoing.push(exportAllSaved(exportTarget));

  let results: GetContentResult[] = [];

  if (input.length) {
    const targets = await buildTargets(input, targetOptions, runOptions);

    const name = save || saveOnly;
    if (name) {
      ongoing.push(confirmAndSave(name, targets as NamedTarget[]));
      if (saveOnly) return {};
    }

    // Launch browser in advance if any targets are known to require it
    if (targets.some(({ forceBrowser }) => forceBrowser)) launchBrowser();

    results = await Promise.all(
      targets.map((target) =>
        getContent(target).then(async (result) => {
          if (!state.orderedPrint) {
            printResult(result, targets.length);
          }
          return result;
        })
      )
    );
  } else if (state.isInputRequired) {
    throw error`No input`;
  }

  if (orderedPrint) {
    printAllResults(results);
  }

  await Promise.all(ongoing);

  return results.reduce((result, { name, content }) => ({ ...result, [name || defaults.targetName]: content }), {});
}
