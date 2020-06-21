import { readdirSync, mkdirSync, existsSync, readFile, writeFile } from 'fs';
import { promisify } from 'util';
import path from 'path';

import { filterProps } from '../util';
import { Target, NamedTarget, isGroup, TargetGroup } from './types';
import defaults from './defaults';

export const dataDir = `${path.resolve(__dirname, '../data')}`;

const read = promisify(readFile);
const write = promisify(writeFile);

const knownTargets: Record<string, NamedTarget> = {};

export const readTarget = async (name: string): Promise<NamedTarget> =>
  knownTargets[name] ??
  read(`${dataDir}/${name}.json`, 'utf8').then((contents) => {
    const target = { ...defaults, name, ...JSON.parse(contents) } as NamedTarget;
    knownTargets[name] = target;
    return target;
  });

const readRecursive = async (name: string): Promise<NamedTarget[]> => {
  const target = await readTarget(name);
  if (isGroup(target)) {
    const members = await Promise.all(target.members.map(readRecursive));
    return members.flat();
  }
  return [target];
};

const writeTarget = async (name: string, target: Target | Pick<TargetGroup, 'members'>) => {
  knownTargets[name] = { name, ...target } as NamedTarget;
  return write(`${dataDir}/${name}.json`, JSON.stringify(filterProps(target, ([key, value]) => value !== defaults[key])), 'utf8');
};

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

  const uniqueTargets = Object.values(nameToTarget);

  uniqueTargets.forEach((target) => (knownTargets[target.name] = target));

  return uniqueTargets;
};

export const readSavedTargetNames = (): string[] => {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
    return [];
  }
  return readdirSync(dataDir)
    .filter((fileName) => fileName?.endsWith('.json'))
    .map((fileName) => fileName.slice(0, -5));
};
