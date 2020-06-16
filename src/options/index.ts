import { formatUrl, highlight, printIf } from '../util';
import { CLI } from '../cli';

import { readSavedNames, readOptions, loadSavedOptions, saveOptions } from './data';
import { NamedOptions, BrowsOptions, ContentType } from './types';

export { readOptions, dataDir, updateSavedOptions } from './data';
export { BrowsOptions } from './types';

export async function buildOptions({ input, flags }: CLI): Promise<BrowsOptions[]> {
  const savedNames = readSavedNames();

  if (flags.listSaved) {
    const listPromise = Promise.all(savedNames.sort().map(readOptions)).then(printOptions);
    if (!input.length) {
      await listPromise;
      return []; // Allow listSaved call with no input
    }
  }

  if (!input.length) {
    throw new Error('No input');
  }

  const { html, save, verbose, saveOnly } = flags;
  const name = save || saveOnly;
  const contentType = html ? ContentType.OUTER_HTML : ContentType.TEXT_CONTENT;

  const { stdout } = printIf(verbose);

  let currentRunTargets: BrowsOptions[];

  if (input.every((str) => savedNames.includes(str))) {
    stdout(`Loading saved options for: ${input.map(highlight).join(', ')}`);
    currentRunTargets = await loadSavedOptions(input, flags).then((options) => {
      stdout(`Loaded saved options for: ${options.map(({ name }) => highlight(name)).join()}`);
      return options;
    });
  } else {
    const url = formatUrl(input[0]);
    const selector = input[1];

    if (!url || !selector) {
      throw new Error('URL and selector required');
    }
    currentRunTargets = [{ name, url, selector, contentType, ...flags }];
  }

  if (name) {
    const savePromise = saveOptions(name, currentRunTargets as NamedOptions[]).then(() =>
      stdout(`Saved ${highlight(name)} options`)
    );
    if (saveOnly) {
      await savePromise;
      return [];
    }
  }

  return currentRunTargets;
}

function printOptions(namedOptions: NamedOptions[]) {
  if (!namedOptions.length) return;
  const formattedOptions = namedOptions.map(({ name, ...options }) => {
    const contents = Object.entries(options)
      .map(([key, value]) => `  ${highlight(key)}: ${value}`)
      .join('\n');

    return `${highlight(name)}:\n${contents}`;
  });
  console.log(formattedOptions.join('\n'));
}
