import { TargetOptions, RunOptions } from '../options';
import { formatUrl, highlight, printIf, plural } from '../util';

import { readSavedTargetNames, readTarget, loadSavedTargets, saveTarget } from './data';
import { NamedTarget, Target, ContentType } from './types';

export { readTarget, updateSavedTarget, dataDir } from './data';
export { Target, ContentType } from './types';

export async function buildTargets(input: string[], targetOptions: TargetOptions, runOptions: RunOptions): Promise<Target[]> {
  const savedNames = readSavedTargetNames();

  const { listSaved, verbose } = runOptions;

  if (listSaved) {
    const listPromise = Promise.all(savedNames.sort().map(readTarget)).then(printTargets);
    if (!input.length) {
      await listPromise;
      return []; // Allow listSaved call with no input
    }
  }

  if (!input.length) {
    throw new Error('No input');
  }

  const { save, saveOnly, html, forceBrowser } = targetOptions;
  const name = save || saveOnly;
  const contentType = html ? ContentType.OUTER_HTML : ContentType.TEXT_CONTENT;

  const { stdout, stderr } = printIf(verbose);

  let currentRunTargets: Target[];

  if (input.every((param) => savedNames.includes(param))) {
    stdout(`Loading saved ${plural('target', input.length)}: ${input.map(highlight).join(', ')}`);

    currentRunTargets = await loadSavedTargets(input).then((targets) => {
      stdout(`Loaded saved ${plural('target', targets.length)}: ${targets.map(({ name }) => highlight(name)).join(', ')}`);
      return targets;
    });
  } else {
    const url = formatUrl(input[0]);
    const selector = input[1];

    if (!url || !selector) {
      throw new Error('URL and selector required');
    }

    if (input.length > 2) {
      const extraParams = input.slice(2).map(highlight).join(', ');
      stderr(`Expected one URL and one CSS selector, received ${highlight(input.length)} parameters. Ignoring: ${extraParams}`);
    }

    currentRunTargets = [{ name, url, selector, contentType, forceBrowser }];
  }

  if (name) {
    const savePromise = saveTarget(name, currentRunTargets as NamedTarget[]).then(() => stdout(`Saved ${highlight(name)} target`));
    if (saveOnly) {
      await savePromise;
      return [];
    }
  }

  return currentRunTargets;
}

function printTargets(targets: NamedTarget[]) {
  if (!targets.length) return;
  const formattedTargets = targets.map(({ name, ...target }) => {
    const contents = Object.entries(target)
      .map(([key, value]) => `  ${highlight(key)}: ${value}`)
      .join('\n');

    return `${highlight(name)}:\n${contents}`;
  });
  console.log(formattedTargets.join('\n'));
}
