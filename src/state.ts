import { RunOptions } from './options';

let options: RunOptions;

export const init = (runOptions: RunOptions): RunOptions => {
  options = runOptions;
  return runOptions;
};

export default {
  get verbose(): boolean {
    return options.verbose;
  },

  get orderedPrint(): boolean {
    return options.ordered;
  },

  get isInputRequired(): boolean {
    return !(options.listSaved || options.import || options.export);
  },
};
