import { readdirSync, mkdirSync, existsSync, promises } from 'fs';
import path from 'path';

import { filterProps, error } from '../util';
import { stdout, confirm, Color } from '../stdio';

import ExportData from './ExportData';
import defaults, { exportsFileName } from './defaults';
import { Target, NamedTarget, isGroup, TargetGroup } from './types';

export const dataDir = `${path.resolve(__dirname, '../data')}`;

const { readFile, writeFile, rmdir, lstat } = promises;

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
  return writeFile(
    `${dataDir}/${name}.json`,
    JSON.stringify(filterProps(target, ([key, value]) => value !== defaults[key])),
    'utf8'
  );
};

const saveTarget = async (name: string, data: NamedTarget | NamedTarget[], printSuccess = true): Promise<void> => {
  let dataToSave;

  if ((Array.isArray(data) && data.length === 1) || !Array.isArray(data)) {
    const { url, selector, contentType, allMatches, delim, forceBrowser } = Array.isArray(data) ? data[0] : data;
    dataToSave = { url, selector, contentType, allMatches, delim, forceBrowser };
  } else {
    dataToSave = { members: [...new Set(data.map(({ name: memberName }) => memberName))] };
  }

  return writeTarget(name, dataToSave).then(() => {
    if (printSuccess) stdout.verbose.success`Saved ${name}`;
  });
};

export const confirmAndSave = async (name: string, target: Target[]): Promise<void> => {
  if (!name) throw error`Cannot save without name`;

  if (getSavedNames().includes(name)) {
    try {
      await confirm`${name} already exists, overwrite?`;
    } catch {
      return stdout.sync`Aborted saving ${name} ${Color.YELLOW}`;
    }
  }

  saveTarget(name, target as NamedTarget[]);
};

export const updateSavedTarget = (name: string, updates: Partial<Target>): Promise<void> =>
  readTarget(name).then((savedTarget) => saveTarget(name, { ...savedTarget, ...updates }, false));

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
    stdout.verbose`Created directory ${dataDir} for brows data`;
    return [];
  }

  stdout.verbose`Reading saved target and group names from: ${[dataDir, Color.DIM]}`;
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
  stdout.verbose`Loading all saved targets and groups for export`;
  const allSaved = await Promise.all(getSavedNames().map(readTarget));

  if (!allSaved.length) {
    throw error`No saved data to export`;
  }

  stdout.verbose`Exporting ${allSaved.length} items`;
  const exportsYaml = new ExportData(allSaved).toYaml();
  stdout.verbose.success`Converted data to export format`;

  let targetPath = path.resolve(process.cwd(), filePath);
  if (await isDir(targetPath)) targetPath = path.resolve(targetPath, exportsFileName);

  if (existsSync(targetPath)) {
    try {
      await confirm`${targetPath} already exists. 
                    Overwrite?`;
    } catch {
      return stdout.sync`Aborted export ${Color.YELLOW}`;
    }
  }

  stdout.verbose`Saving exports to: ${targetPath}`;
  await writeFile(targetPath, exportsYaml, 'utf8');
  stdout.verbose.success`Export complete`;
};

export const importAllFromFile = async (filePath: string): Promise<void> => {
  let targetPath = path.resolve(process.cwd(), filePath);
  if (await isDir(targetPath)) targetPath = path.resolve(targetPath, exportsFileName);
  stdout.verbose`Importing from: ${targetPath}`;

  const contents = await readFile(targetPath, 'utf8');
  stdout.verbose.success`Read file contents`;

  const [targets, groups] = new ExportData(contents, targetPath.endsWith('.json')).toInternalData();
  stdout.verbose.success`Found ${targets.length} targets and ${groups.length} groups in file`;

  const existingNames = getSavedNames();
  const namesInBoth = [...targets, ...groups].map(({ name }) => name).filter((name) => existingNames.includes(name));

  if (namesInBoth.length) {
    try {
      await confirm`${namesInBoth.length} names match existing ones and would be overwritten: ${namesInBoth}
                    Import anyway?`;
    } catch {
      return stdout.sync`Aborted import ${Color.YELLOW}`;
    }
  } else {
    stdout.verbose`No overlap with existing data found`;
  }
  const savingTargets = targets.map((target) => saveTarget(target.name, target));
  const savingGroups = groups.map(({ name, members }) => writeTarget(name, { members }));
  await Promise.all([...savingTargets, ...savingGroups]);
  stdout.verbose.success`Import complete`;
};

export const deleteAllData = (): Promise<void> => rmdir(dataDir, { recursive: true });
