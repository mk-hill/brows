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

const saveOptions = (name: string, content: BrowsOptions) =>
  promisify(writeFile)(`${dataDir}/${name}.json`, JSON.stringify(content), 'utf8');

export const readOptions = (name: string) =>
  promisify(readFile)(`${dataDir}/${name}.json`, 'utf8').then((contents) => JSON.parse(contents) as BrowsOptions);

export const updateSavedOptions = (name: string, updates: Partial<BrowsOptions>) =>
  readOptions(name).then((savedOptions) => saveOptions(name, { ...savedOptions, ...updates }));

export async function buildOptions({ input, flags }: CLI): Promise<BrowsOptions[]> {
  if (!input.length) {
    throw new Error('Missing input');
  }

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
  }

  const { html, save, forceBrowser, verbose } = flags;
  const contentType = html ? ContentType.OUTER_HTML : ContentType.TEXT_CONTENT;

  const { stdout } = printIf(verbose);

  const savedNames = readdirSync(dataDir)
    .filter((fileName) => fileName?.endsWith('.json'))
    .map((fileName) => fileName.slice(0, -5));

  if (input.every((str) => savedNames.includes(str))) {
    stdout(`Loading saved options for: ${input.map(highlight).join(', ')}`);
    return Promise.all(input.map((name) => readOptions(name).then((savedOptions) => ({ name, ...flags, ...savedOptions }))));
  }

  const url = formatUrl(input[0]);
  const selector = input[1];

  if (!url || !selector) {
    throw new Error('URL and selector required');
  }

  if (save) {
    saveOptions(save, { url, selector, contentType, forceBrowser }).then(() => stdout(`Saved ${highlight(save)} options`));
  }

  return [{ url, selector, contentType, name: save, ...flags }];
}
