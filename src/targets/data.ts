import { readdirSync, mkdirSync, existsSync, promises } from 'fs';
import path from 'path';

import { filterProps, printIfVerbose, highlight, confirm } from '../util';

import defaults, { exportsFileName } from './defaults';
import ExportData from './ExportData';
import { Target, NamedTarget, isGroup, TargetGroup } from './types';

export const dataDir = `${path.resolve(__dirname, '../data')}`;

const { readFile, writeFile, rmdir, lstat } = promises;

const { stdout } = printIfVerbose;

const knownTargets: Record<string, NamedTarget | undefined> = {};

export const readTarget = async (name: string): Promise<NamedTarget> =>
  knownTargets[name] ??
  readFile(`${dataDir}/${name}.json`, 'utf8').then((contents) => {
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
  await writeFile(
    `${dataDir}/${name}.json`,
    JSON.stringify(filterProps(target, ([key, value]) => value !== defaults[key])),
    'utf8'
  );
  stdout(`Saved ${highlight(name)}`);
};

const saveTarget = async (name: string, data: NamedTarget | NamedTarget[]): Promise<void> => {
  if ((Array.isArray(data) && data.length === 1) || !Array.isArray(data)) {
    const { url, selector, contentType, allMatches, delim, forceBrowser } = Array.isArray(data) ? data[0] : data;
    return writeTarget(name, { url, selector, contentType, allMatches, delim, forceBrowser });
  }

  return writeTarget(name, { members: [...new Set(data.map(({ name: memberName }) => memberName))] });
};

export const confirmAndSave = async (name: string, target: Target[]): Promise<void> => {
  if (!name) throw new Error('Cannot save without name');

  if (getSavedNames().includes(name)) {
    try {
      await confirm(`${highlight(name)} already exists, overwrite?`);
    } catch {
      return console.log(`Aborted saving ${highlight(name)}`);
    }
  }

  saveTarget(name, target as NamedTarget[]);
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

  return uniqueTargets;
};

export const getSavedNames = (): string[] => {
  const knownNames = Object.keys(knownTargets);
  if (knownNames.length) return knownNames;

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
    stdout(`Created directory ${highlight(dataDir)} for brows data`);
    return [];
  }

  stdout(`Reading saved target and group names from ${highlight(dataDir)}`);
  const names = readdirSync(dataDir)
    .filter((fileName) => fileName?.endsWith('.json'))
    .map((fileName) => fileName.slice(0, -5));

  names.forEach((name) => {
    if (!knownTargets[name]) knownTargets[name] = undefined;
  });

  return names;
};

const isDir = (path: string): Promise<boolean> =>
  lstat(path)
    .then((stat) => !stat.isFile())
    .catch(() => false);

export const exportAllSaved = async (filePath: string): Promise<void> => {
  stdout('Loading all saved targets and groups for export');
  const allSaved = await Promise.all(getSavedNames().map(readTarget));

  if (!allSaved.length) {
    throw new Error('No saved data to export');
  }

  stdout(`Exporting ${highlight(allSaved.length)} items`);
  const exportsYaml = new ExportData(allSaved).toYaml();
  stdout('Converted data to export format');

  let targetPath = path.resolve(process.cwd(), filePath);
  if (await isDir(targetPath)) targetPath = path.resolve(targetPath, exportsFileName);

  if (existsSync(targetPath)) {
    try {
      await confirm(`${targetPath} already exists, overwrite?`);
    } catch {
      return console.log('Aborted export');
    }
  }

  stdout(`Saving exports to ${highlight(targetPath)}`);
  await writeFile(targetPath, exportsYaml, 'utf8');
  stdout(`${highlight(targetPath)} saved`);
};

export const importAllFromFile = async (filePath: string): Promise<void> => {
  let targetPath = path.resolve(process.cwd(), filePath);
  if (await isDir(targetPath)) targetPath = path.resolve(targetPath, exportsFileName);
  stdout(`Importing from ${highlight(targetPath)}`);

  const contents = await readFile(targetPath, 'utf8');
  stdout(`Read file contents`);
  const [targets, groups] = new ExportData(contents, targetPath.endsWith('.json')).toInternalData();
  stdout(`Found ${highlight(targets.length)} targets and ${highlight(groups.length)} groups in file`);

  const existingNames = getSavedNames();
  const namesInBoth = [...targets, ...groups].map(({ name }) => name).filter((name) => existingNames.includes(name));

  if (namesInBoth.length) {
    const names = namesInBoth.map(highlight).join(', ');
    try {
      await confirm(
        `${highlight(namesInBoth.length)} names match existing ones and would be overwritten: ${names}\nImport anyway?`
      );
    } catch {
      return console.log('Aborted import');
    }
  } else {
    stdout(`No overlap with existing data found`);
  }
  const savingTargets = targets.map((target) => saveTarget(target.name, target));
  const savingGroups = groups.map(({ name, members }) => writeTarget(name, { members }));
  await Promise.all([...savingTargets, ...savingGroups]);
  stdout('Import complete');
};

export const deleteAllData = (): Promise<void> => rmdir(dataDir, { recursive: true });
