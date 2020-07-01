import readline from 'readline';

import state from '../state';
import { TaggedVars, Color } from './types';
import { formatMessage } from './format';

export async function confirm(rawStrings: TemplateStringsArray, ...variables: TaggedVars): Promise<void> {
  if (state.acceptAllPrompts || state.suppressAllOutput) return;

  await state.promptSettled;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promise: Promise<void> = new Promise((resolve, reject) => {
    rl.question(formatMessage(rawStrings, ...variables, Color.YELLOW) + ' Y/N:', (answer) => {
      rl.close();
      state.prompt = null;

      const confirmed = ['yes', 'y'].includes(answer?.trim()?.toLowerCase());
      return confirmed ? resolve() : reject();
    });
  });

  state.prompt = promise;
  return promise;
}
