import { readdirSync, mkdirSync, existsSync, readFile, writeFile, rmdir } from 'fs';
import { promisify } from 'util';
import path from 'path';

import { filterProps, printIfVerbose, highlight } from '../util';

import defaults from './defaults';
import ExportData from './ExportData';
import { Target, NamedTarget, isGroup, TargetGroup } from './types';

export const dataDir = `${path.resolve(__dirname, '../data')}`;

const read = promisify(readFile);
const write = promisify(writeFile);
const rmDir = promisify(rmdir);

const { stdout } = printIfVerbose;

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
  await write(`${dataDir}/${name}.json`, JSON.stringify(filterProps(target, ([key, value]) => value !== defaults[key])), 'utf8');
  stdout(`Saved ${highlight(name)}`);
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
    stdout(`Created directory ${highlight(dataDir)} for brows data`);
    return [];
  }

  stdout(`Reading saved target and group names from ${highlight(dataDir)}`);
  return readdirSync(dataDir)
    .filter((fileName) => fileName?.endsWith('.json'))
    .map((fileName) => fileName.slice(0, -5));
};

export const exportAllSaved = async (filePath: string): Promise<void> => {
  stdout('Loading all saved targets and groups for export');
  const allSaved = await Promise.all(readSavedTargetNames().map(readTarget));

  if (!allSaved.length) {
    throw new Error('No saved data to export');
  }

  stdout(`Exporting ${highlight(allSaved.length)} items`);
  const exportsYaml = new ExportData(allSaved).toYaml();
  stdout('Converted data to export format');
  const targetPath = path.resolve(process.cwd(), filePath);

  if (existsSync(targetPath)) {
    throw new Error(`${targetPath} already exists, specify desired filename`);
  }

  stdout(`Saving exports to ${highlight(targetPath)}`);
  await write(targetPath, exportsYaml, 'utf8');
  stdout(`${highlight(targetPath)} saved`);
};

export const importAllFromFile = async (filePath: string): Promise<void> => {
  const targetPath = path.resolve(process.cwd(), filePath);
  stdout(`Importing from ${highlight(targetPath)}`);
  const contents = await read(targetPath, 'utf8');
  stdout(`Read file contents`);
  const [targets, groups] = new ExportData(contents, targetPath.endsWith('.json')).toInternalData();
  stdout(`Found ${highlight(targets.length)} targets and ${highlight(groups.length)} groups in file, saving data`);

  const existingNames = readSavedTargetNames();
  const filesToBeOverwritten = [...targets, ...groups].map(({ name }) => name).filter((name) => existingNames.includes(name));

  if (filesToBeOverwritten.length) {
    const names = filesToBeOverwritten.map(highlight).join(', ');
    const message =
      `${highlight(filesToBeOverwritten.length)} names match existing ones and would be overwritten: ${names}` +
      '\n' +
      'Aborting import. Future versions will most likely have prompts for this kind of thing.' +
      '\n' +
      `For now, you can manually delete files from ${highlight(dataDir)} or rename imports`;
    throw new Error(message);
  } else {
    stdout(`No overlap with existing data found`);
  }
  const savingTargets = targets.map((target) => saveTarget(target.name, target));
  const savingGroups = groups.map(({ name, members }) => writeTarget(name, { members }));
  await Promise.all([...savingTargets, ...savingGroups]);
  stdout('Import complete');
};

export const deleteAllData = (): Promise<void> => rmDir(dataDir, { recursive: true });
