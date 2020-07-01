import { TargetOptions, RunOptions } from '../options';
import { formatUrl, plural, splitByFilter, error } from '../util';

import ExportData from './ExportData';
import defaultTarget from './defaults';
import { Target, ContentType } from './types';
import { getSavedNames, readTarget, loadSavedTargets } from './data';
import { stdout, stderr, highlight, Color } from '../stdio';

export { readTarget, confirmAndSave, updateSavedTarget, dataDir, exportAllSaved, importAllFromFile } from './data';
export { Target, NamedTarget, ContentType } from './types';

export async function buildTargets(input: string[], targetOptions: TargetOptions, runOptions: RunOptions): Promise<Target[]> {
  const savedTargetNames = getSavedNames();

  const { save, saveOnly } = runOptions;
  const { html, forceBrowser, allMatches, delim } = targetOptions;
  const name = save || saveOnly;
  const contentType = html ? ContentType.OUTER_HTML : ContentType.TEXT_CONTENT;

  let targets: Target[];

  const [foundNames, rest] = splitByFilter(input, (param) => savedTargetNames.includes(param));
  if (foundNames.length) {
    if (rest.length) {
      stderr`Found ${foundNames} in saved targets but not: ${rest}
             Ignoring: ${rest}
             Use either one URL followed by one CSS selector or only saved target names`;
    }

    const inputTarget = [plural('target', foundNames.length), Color.YELLOW];
    stdout.verbose`Loading saved ${inputTarget}: ${foundNames}`;

    targets = await loadSavedTargets(foundNames).then((targets) => {
      const loadedTarget = [plural('target', targets.length), Color.GREEN];
      stdout.verbose.success`Loaded saved ${loadedTarget}: ${targets.map(({ name }) => name)}`;

      return targets;
    });
  } else {
    stdout.verbose`No matching names found, using first parameter as URL and second as selector.`;
    const url = formatUrl(input[0]);
    const selector = input[1];

    if (!url || !selector) {
      throw error`URL and selector required`;
    }

    if (input.length > 2) {
      const extraParams = input.slice(2);
      stderr`Expected one URL and one CSS selector, received ${[input.length, Color.BRIGHT]} parameters. 
             Ignoring: ${[extraParams, Color.BRIGHT]}`;
    }

    targets = [{ name, url, selector, contentType, allMatches, delim, forceBrowser }];
  }

  return targets;
}

export const listSavedTargets = (): Promise<void> =>
  Promise.all(getSavedNames().map(readTarget)).then((allSaved) => {
    if (!allSaved.length) error`No saved data to list`;
    // highlight all keys except target properties
    const regex = new RegExp(`^(?!\\s*(${Object.keys(defaultTarget).join('|')}):)\\s*(.*)(?=:)`, 'gm');
    const message = new ExportData(allSaved).toYaml().replace(regex, highlight);
    stdout.raw(message.trim());
  });
