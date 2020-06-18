import { TargetOptions, RunOptions, Options } from './options';

export const targetOptions: TargetOptions = {
  save: '',
  saveOnly: '',
  html: false,
  forceBrowser: false,
};

export const runOptions: RunOptions = {
  listSaved: false,
  verbose: false,
};

export const options: Options = {
  ...targetOptions,
  ...runOptions,
};

export const targetName = 'content';
