import { TargetOptions, RunOptions } from '../options';
import { formatUrl, highlight, printIfVerbose, plural, splitByFilter } from '../util';

import { readSavedTargetNames, readTarget, loadSavedTargets, saveTarget } from './data';
import { NamedTarget, Target, ContentType } from './types';

export { readTarget, updateSavedTarget, dataDir } from './data';
export { Target, ContentType } from './types';

const { stdout, stderr } = printIfVerbose;

export async function buildTargets(input: string[], targetOptions: TargetOptions, runOptions: RunOptions): Promise<Target[]> {
  const savedTargetNames = readSavedTargetNames();

  const { save, saveOnly } = runOptions;
  const { html, forceBrowser } = targetOptions;
  const name = save || saveOnly;
  const contentType = html ? ContentType.OUTER_HTML : ContentType.TEXT_CONTENT;

  let targets: Target[];

  const [foundNames, rest] = splitByFilter(input, (param) => savedTargetNames.includes(param));
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

export const listSavedTargets = (): Promise<void> => {
  console.log('listing');
  return Promise.all(readSavedTargetNames().sort().map(readTarget)).then(printTargets);
};

export const saveCurrentTargets = (name: string, targets: NamedTarget[]): Promise<void> =>
  saveTarget(name, targets).then(() => stdout(`Saved ${highlight(name)} target`));
