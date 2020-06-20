import { TargetOptions, RunOptions } from '../options';
import { formatUrl, highlight, printIf, plural, splitByFilter } from '../util';

import { getSavedTargetNames, readTarget, loadSavedTargets, saveTarget } from './data';
import { NamedTarget, Target, ContentType } from './types';

export { readTarget, updateSavedTarget, dataDir } from './data';
export { Target, ContentType } from './types';

export async function buildTargets(input: string[], targetOptions: TargetOptions, runOptions: RunOptions): Promise<Target[]> {
  const savedNames = getSavedTargetNames();

  const { listSaved, verbose, save, saveOnly } = runOptions;

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

  const { html, forceBrowser } = targetOptions;
  const name = save || saveOnly;
  const contentType = html ? ContentType.OUTER_HTML : ContentType.TEXT_CONTENT;

  const { stdout, stderr } = printIf(verbose);

  let targets: Target[];

  const [foundNames, rest] = splitByFilter(input, (param) => savedNames.includes(param));
  if (foundNames.length) {
    if (rest.length) {
      const [found, unknown] = [foundNames, rest].map((ar) => ar.map(highlight).join(', '));
      const suggestion = 'Use either one URL followed by one CSS selector or only saved target names';
      stderr(`Found ${found} in saved targets but not ${unknown}\nIgnoring ${unknown}\n${suggestion}`);
    }
    stdout(`Loading saved ${plural('target', foundNames.length)}: ${foundNames.map(highlight).join(', ')}`);
    targets = await loadSavedTargets(foundNames).then((targets) => {
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

    targets = [{ name, url, selector, contentType, forceBrowser }];
  }

  if (name) {
    const savePromise = saveTarget(name, targets as NamedTarget[]).then(() => stdout(`Saved ${highlight(name)} target`));
    if (saveOnly) {
      await savePromise;
      return [];
    }
  }

  return targets;
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
