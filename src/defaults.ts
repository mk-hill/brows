import { TargetOptions, RunOptions, Options } from './options';

export const targetOptions: TargetOptions = {
  html: false,
  forceBrowser: false,
};

export const runOptions: RunOptions = {
  save: '',
  saveOnly: '',
  listSaved: false,
  export: '',
  import: '',
  ordered: false,
  verbose: false,
};

export const options: Options = {
  ...targetOptions,
  ...runOptions,
};

export const targetName = 'content';
