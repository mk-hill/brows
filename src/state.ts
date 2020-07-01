import { RunOptions } from './options';
import { runOptions } from './defaults';

let options: RunOptions = runOptions;

export const init = (runOptions: RunOptions): RunOptions => {
  options = runOptions;
  return runOptions;
};

let ongoingPrompt: Promise<void> | null = null;

export default {
  get verbose(): boolean {
    return options.verbose;
  },

  get orderedPrint(): boolean {
    return options.orderedPrint;
  },

  get acceptAllPrompts(): boolean {
    return options.acceptAllPrompts;
  },

  get isInputRequired(): boolean {
    return !(options.listSaved || options.import || options.export);
  },

  set prompt(promise: Promise<void> | null) {
    ongoingPrompt = promise;
  },

  get hasPrompt(): boolean {
    return ongoingPrompt !== null;
  },

  get promptSettled(): Promise<void> | undefined {
    return ongoingPrompt?.catch(() => undefined);
  },

  get promptResolved(): Promise<void> | null {
    return ongoingPrompt;
  },

  get suppressAllOutput(): boolean {
    return options.suppressAllOutput;
  },
};
