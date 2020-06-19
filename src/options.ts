import * as defaults from './defaults';
import { Input } from '.';

/**
 * Options saved per target
 */
export interface TargetOptions {
  save: string;
  saveOnly: string;
  html: boolean;
  forceBrowser: boolean;
}

/**
 * Options determined separately for each run
 */
export interface RunOptions {
  listSaved: boolean;
  ordered: boolean;
  verbose: boolean;
}

export interface Options extends TargetOptions, RunOptions {}

const isTargetOption = (key: string): key is keyof TargetOptions => key in defaults.targetOptions;
const isRunOption = (key: string): key is keyof RunOptions => key in defaults.runOptions;

const splitOptions = (options: Options) =>
  Object.entries(options).reduce(
    (ar, [key, value]) => {
      if (isTargetOption(key)) {
        ar[0][key] = value;
      } else if (isRunOption(key)) {
        ar[1][key] = value;
      } else {
        throw new Error(`Invalid option: ${key}`);
      }
      return ar;
    },
    [{}, {}] as [Partial<TargetOptions>, Partial<RunOptions>]
  ) as [TargetOptions, RunOptions];

const isOptions = (obj: string | Partial<Options>): obj is Partial<Options> =>
  typeof obj === 'object' && obj !== null && Object.keys(obj).some((key) => key in defaults.options);

const isValidInput = (input: Input): input is string[] => input.every((member) => typeof member === 'string');

export function extractOptions(args: Input): [string[], TargetOptions, RunOptions] {
  const input = [...args];
  let options = {};
  if (isOptions(input[input.length - 1])) options = input.pop() as Partial<Options>;
  if (!isValidInput(input)) throw new Error('Invalid arguments');

  return [input, ...splitOptions({ ...defaults.options, ...options })];
}
