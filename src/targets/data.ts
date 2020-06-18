import { readdirSync, mkdirSync, existsSync, readFile, writeFile } from 'fs';
import { promisify } from 'util';
import path from 'path';

import { BrowsOptions, NamedOptions, isParent } from './types';
import { TargetOptions } from '../options';

export const dataDir = `${path.resolve(__dirname, 'data')}`;

const read = promisify(readFile);
const write = promisify(writeFile);

export const readOptions = (name: string): Promise<NamedOptions> =>
  read(`${dataDir}/${name}.json`, 'utf8').then((contents) => JSON.parse(contents) as NamedOptions);

export const readChildren = async (name: string): Promise<NamedOptions[]> => {
  const options = await readOptions(name);
  if (isParent(options)) {
    const children = await Promise.all(options.children.map(readChildren));
    return children.flat();
  }
  return [options];
};

const writeOptions = (name: string, content: Partial<NamedOptions>) =>
  write(`${dataDir}/${name}.json`, JSON.stringify({ name, ...content }), 'utf8');

export const saveOptions = async (name: string, content: Partial<NamedOptions> | NamedOptions[]): Promise<void> => {
  if ((Array.isArray(content) && content.length === 1) || !Array.isArray(content)) {
    const { url, selector, contentType, forceBrowser } = Array.isArray(content) ? content[0] : content;
    return writeOptions(name, { url, selector, contentType, forceBrowser });
  }
  return writeOptions(name, { children: [...new Set(content.map(({ name: childName }) => childName))] });
};

export const updateSavedOptions = (name: string, updates: Partial<BrowsOptions>): Promise<void> =>
  readOptions(name).then((savedOptions) => saveOptions(name, { ...savedOptions, ...updates }));

export const loadSavedOptions = async (names: string[], options: TargetOptions): Promise<NamedOptions[]> => {
  const savedOptions: NamedOptions[][] = await Promise.all(
    names.map((name) => readChildren(name).then((children) => children.map((savedChild) => ({ ...options, ...savedChild }))))
  );

  // Don't retrieve duplicate contents if multiple overlapping parents are passed in single run
  const nameToOptions = savedOptions.flat().reduce((map: Record<string, NamedOptions>, options) => {
    if (!map[options.name]) map[options.name] = options;
    return map;
  }, {});

  return Object.values(nameToOptions);
};

export const readSavedNames = (): string[] => {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
    return [];
  }
  return readdirSync(dataDir)
    .filter((fileName) => fileName?.endsWith('.json'))
    .map((fileName) => fileName.slice(0, -5));
};
