import { readdirSync, mkdirSync, existsSync, readFile, writeFile } from 'fs';
import { promisify } from 'util';
import path from 'path';

import { formatUrl, highlight, printIf } from './util';
import { CLI } from './cli';

export enum ContentType {
  TEXT_CONTENT = 'textContent',
  OUTER_HTML = 'outerHTML',
}

export interface BrowsOptions {
  url: string;
  selector: string;
  contentType: ContentType;
  forceBrowser?: boolean;
  verbose?: boolean;
  name?: string;
}

export const dataDir = `${path.resolve(__dirname, 'data')}`;

const saveOptions = (name: string, content: BrowsOptions): Promise<void> =>
  promisify(writeFile)(`${dataDir}/${name}.json`, JSON.stringify(content), 'utf8');

export const readOptions = (name: string): Promise<BrowsOptions> =>
  promisify(readFile)(`${dataDir}/${name}.json`, 'utf8').then((contents) => JSON.parse(contents) as BrowsOptions);

export const updateSavedOptions = (name: string, updates: Partial<BrowsOptions>): Promise<void> =>
  readOptions(name).then((savedOptions) => saveOptions(name, { ...savedOptions, ...updates }));

async function printOptions(allOptions: BrowsOptions[]) {
  if (!allOptions.length) return;
  const formattedOptions = allOptions.map(({ name, ...options }) => {
    const titleLine = name ? `${highlight(name)}:` : '';

    const contents = Object.entries(options)
      .map(([key, value]) => `  ${highlight(key)}: ${value}`)
      .join('\n');

    return `${titleLine}\n${contents}`;
  });
  console.log(formattedOptions.join('\n'));
}

export async function buildOptions({ input, flags }: CLI): Promise<BrowsOptions[]> {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
  }

  const savedNames = readdirSync(dataDir)
    .filter((fileName) => fileName?.endsWith('.json'))
    .map((fileName) => fileName.slice(0, -5));

  if (flags.listSaved) {
    const listPromise = Promise.all(savedNames.map(async (name) => ({ name, ...(await readOptions(name)) }))).then(printOptions);
    // Allow listSaved call with no input
    if (!input.length) {
      await listPromise;
      return [];
    }
  }

  if (!input.length) {
    throw new Error('No input');
  }

  const { html, save, forceBrowser, verbose, saveOnly } = flags;

  const contentType = html ? ContentType.OUTER_HTML : ContentType.TEXT_CONTENT;

  const { stdout } = printIf(verbose);

  if (input.every((str) => savedNames.includes(str))) {
    stdout(`Loading saved options for: ${input.map(highlight).join(', ')}`);
    return Promise.all(input.map((name) => readOptions(name).then((savedOptions) => ({ name, ...flags, ...savedOptions }))));
  }

  const url = formatUrl(input[0]);
  const selector = input[1];

  if (!url || !selector) {
    throw new Error('URL and selector required');
  }

  const name = save || saveOnly;
  if (name) {
    const savePromise = saveOptions(name, { url, selector, contentType, forceBrowser }).then(() =>
      stdout(`Saved ${highlight(name)} options`)
    );
    if (saveOnly) {
      await savePromise;
      return [];
    }
  }

  return [{ url, selector, contentType, name, ...flags }];
}
