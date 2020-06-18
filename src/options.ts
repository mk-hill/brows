import { runOptions, targetOptions } from './defaults';

export interface TargetOptions {
  save: string;
  saveOnly: string;
  html: boolean;
  forceBrowser: boolean;
}

export interface RunOptions {
  listSaved: boolean;
  verbose: boolean;
}

export interface Options extends TargetOptions, RunOptions {}

const isTargetOption = (key: string): key is keyof TargetOptions => key in targetOptions;
const isRunOption = (key: string): key is keyof RunOptions => key in runOptions;

export const splitOptions = (options: Options): [RunOptions, TargetOptions] =>
  Object.entries(options).reduce(
    (ar, [key, value]) => {
      if (isRunOption(key)) {
        ar[0][key] = value;
      } else if (isTargetOption(key)) {
        ar[1][key] = value;
      } else {
        throw new Error(`Invalid option: ${key}`);
      }
      return ar;
    },
    [{}, {}] as [Partial<RunOptions>, Partial<TargetOptions>]
  ) as [RunOptions, TargetOptions];
