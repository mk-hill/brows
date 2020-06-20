import { readdirSync, mkdirSync, existsSync, readFile, writeFile } from 'fs';
import { promisify } from 'util';
import path from 'path';

import { Target, NamedTarget, isGroup } from './types';

export const dataDir = `${path.resolve(__dirname, 'data')}`;

const read = promisify(readFile);
const write = promisify(writeFile);

export const readTarget = (name: string): Promise<NamedTarget> =>
  read(`${dataDir}/${name}.json`, 'utf8').then((contents) => JSON.parse(contents) as NamedTarget);

const readRecursive = async (name: string): Promise<NamedTarget[]> => {
  const target = await readTarget(name);
  if (isGroup(target)) {
    const members = await Promise.all(target.members.map(readRecursive));
    return members.flat();
  }
  return [target];
};

const writeTarget = (name: string, target: Partial<NamedTarget>) =>
  write(`${dataDir}/${name}.json`, JSON.stringify({ name, ...target }), 'utf8');

export const saveTarget = async (name: string, data: NamedTarget | NamedTarget[]): Promise<void> => {
  if ((Array.isArray(data) && data.length === 1) || !Array.isArray(data)) {
    const { url, selector, contentType, forceBrowser } = Array.isArray(data) ? data[0] : data;
    return writeTarget(name, { url, selector, contentType, forceBrowser });
  }

  return writeTarget(name, { members: [...new Set(data.map(({ name: memberName }) => memberName))] });
};

export const updateSavedTarget = (name: string, updates: Partial<Target>): Promise<void> =>
  readTarget(name).then((savedTarget) => saveTarget(name, { ...savedTarget, ...updates }));

export const loadSavedTargets = async (names: string[]): Promise<NamedTarget[]> => {
  const savedTargets: NamedTarget[][] = await Promise.all(names.map(readRecursive));

  // Don't retrieve duplicate contents if multiple overlapping groups are passed in single run
  const nameToTarget = savedTargets.flat().reduce((map: Record<string, NamedTarget>, target) => {
    if (!map[target.name]) map[target.name] = target;
    return map;
  }, {});

  return Object.values(nameToTarget);
};

let _savedTargetNames: string[];
export const getSavedTargetNames = (forceRead = false): string[] => {
  if (!forceRead && _savedTargetNames) return _savedTargetNames;
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
    return [];
  }
  _savedTargetNames = readdirSync(dataDir)
    .filter((fileName) => fileName?.endsWith('.json'))
    .map((fileName) => fileName.slice(0, -5));
  return _savedTargetNames;
};
