import { TargetOptions, RunOptions } from '../options';
import { formatUrl, highlight, printIfVerbose, plural, splitByFilter } from '../util';

import ExportData from './ExportData';
import defaultTarget from './defaults';
import { Target, ContentType } from './types';
import { readSavedTargetNames, readTarget, loadSavedTargets } from './data';

export { readTarget, saveTarget, updateSavedTarget, dataDir, exportAllSaved, importAllFromFile } from './data';
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
      console.error(`Found ${found} in saved targets but not ${unknown}\nIgnoring ${unknown}\n${suggestion}`);
    }
    stdout(`Loading saved ${plural('target', foundNames.length)}: ${foundNames.map(highlight).join(', ')}`);
    targets = await loadSavedTargets(foundNames).then((targets) => {
      stdout(`Loaded saved ${plural('target', targets.length)}: ${targets.map(({ name }) => highlight(name)).join(', ')}`);
      return targets;
    });
  } else {
    stdout('No matching names found, using first parameter as URL and second as selector.');
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

export const listSavedTargets = (): Promise<void> =>
  Promise.all(readSavedTargetNames().map(readTarget)).then((allSaved) => {
    if (!allSaved.length) throw new Error('No saved data to list');
    // highlight all keys except target properties
    const regex = new RegExp(`^(?!\\s*(${Object.keys(defaultTarget).join('|')}):)\\s*(.*)(?=:)`, 'gm');
    const message = new ExportData(allSaved).toYaml().replace(regex, highlight);
    console.log(message);
  });
