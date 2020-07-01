import YAML from 'yaml';

import { filterProps, splitByFilter, typedEntries, formatUrl, plural, error } from '../util';

import defaults, { matchesAllDefaults } from './defaults';
import { NamedTarget, isGroup, Target, TargetGroup, isValidTargetEntry, isValidGroupEntry } from './types';
import { stdout, Color, stderr } from '../stdio';

/**
 * Name to selector string or object of with only non-defaults
 */
type UrlTargets = Record<string, string | Partial<Target>>;

/**
 * URL to UrlTargets
 */
type ExportTargets = Record<string, UrlTargets>;

/**
 * Name to array of member names
 */
type ExportGroups = Record<string, string[]>;

class ExportData {
  private targets: ExportTargets;
  private groups: ExportGroups;

  constructor(fileContents: string, json?: boolean);
  constructor(targetsAndGroups: Array<NamedTarget | TargetGroup>);

  constructor(input: string | Array<NamedTarget | TargetGroup>, json = false) {
    if (typeof input === 'string') {
      stdout.verbose`Parsing file contents`;
      const data = json ? JSON.parse(input) : YAML.parse(input);
      this.targets = data.Targets;
      this.groups = data.Groups;
    } else {
      const [groups, targets] = splitByFilter(input, isGroup);
      this.targets = this.buildExportTargets(targets as NamedTarget[]);
      this.groups = this.buildExportGroups(groups as TargetGroup[]);
    }
  }

  toYaml(): string {
    const data = {
      Targets: this.targets,
      zGroups: this.groups, // groups last, but sort everything within each
    };
    return YAML.stringify(data, { sortMapEntries: true }).replace(/^zGroups/gm, 'Groups');
  }

  toInternalData(): [NamedTarget[], TargetGroup[]] {
    return [this.buildTargets() as NamedTarget[], this.buildGroups()];
  }

  private buildExportTargets(targets: NamedTarget[]) {
    return targets.reduce((map, target) => {
      const { name, url, selector } = target;
      const simplifiedUrl = url.startsWith('http://') ? url.slice(7) : url;
      if (!map[simplifiedUrl]) map[simplifiedUrl] = {};
      if (matchesAllDefaults(target)) {
        map[simplifiedUrl][name] = selector;
      } else {
        map[simplifiedUrl][name] = filterProps(target, ([key, value]) => !['name', 'url'].includes(key) && value !== defaults[key]);
      }
      return map;
    }, {} as ExportTargets);
  }

  private buildExportGroups(groups: TargetGroup[]) {
    return groups.reduce((map, { name, members }) => ({ ...map, [name]: members }), {} as ExportGroups);
  }

  private validateTarget(name: string, exportedTarget: Partial<Target>): Partial<Target> {
    const validOnly = filterProps(exportedTarget, isValidTargetEntry);

    const [validKeys, invalidKeys] = splitByFilter(Object.keys(exportedTarget), (key) => key in validOnly);
    if (invalidKeys.length) {
      const property = [plural('property', invalidKeys.length), Color.RED];
      stderr`Invalid ${property} in ${name}: ${invalidKeys}`;
      if (invalidKeys.includes('selector')) {
        throw error`Cannot import ${name} without valid selector`;
      } else {
        stderr`Only importing valid properties from ${name}: ${validKeys}`;
      }
    }

    return validOnly;
  }

  private buildTargets() {
    return typedEntries(this.targets).reduce((allTargets, [url, targets]) => {
      const formattedUrl = formatUrl(url);
      const targetsInUrl = typedEntries(targets).reduce((urlTargets, [name, exportedTarget]) => {
        let target;
        if (typeof exportedTarget === 'string') {
          target = { ...defaults, name, url: formattedUrl, selector: exportedTarget };
        } else {
          const validOnly = this.validateTarget(name, exportedTarget);
          target = { ...defaults, name, url: formattedUrl, ...validOnly };
        }

        urlTargets.push(target);
        return urlTargets;
      }, [] as Partial<NamedTarget>[]);

      allTargets.push(...targetsInUrl);
      return allTargets;
    }, [] as Partial<NamedTarget>[]);
  }

  private buildGroups() {
    return typedEntries(this.groups).reduce((groups, entry) => {
      const [name, members] = entry;
      if (!isValidGroupEntry(entry)) {
        throw error`Invalid group: ${name}. Groups must consist of an array of target names`;
      }
      groups.push({ name, members });
      return groups;
    }, [] as TargetGroup[]);
  }
}

export default ExportData;
