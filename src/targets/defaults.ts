import { Target, ContentType, NamedTarget } from './types';
import { typedKeys } from '../util';
import { targetOptions } from '../defaults';

const targetDefaults: Partial<Target> = {
  name: undefined,
  url: undefined,
  selector: undefined,
  contentType: ContentType.TEXT_CONTENT,
  allMatches: targetOptions.allMatches,
  delim: targetOptions.delim,
  forceBrowser: targetOptions.forceBrowser,
  members: undefined,
};

export default targetDefaults;

export const exportsFileName = 'brows_exports.yml';

export const matchesAllDefaults = (target: NamedTarget): boolean =>
  typedKeys(targetDefaults)
    .filter((key) => targetDefaults[key] !== undefined) // has a default value
    .every((key) => targetDefaults[key] === target[key]);
