/* eslint-disable @typescript-eslint/no-explicit-any */
import state from '../state';

import { TaggedVars, Color, Stdout, Stderr, TemplateFn, isColor } from './types';
import { formatMessage, formatResult, formatAllResults } from './format';
import { GetContentResult } from '../getContent';

/**
 * Print string without formatting or waiting for prompt
 */
const createSyncFn = (type: 'log' | 'error' = 'log') => (message: string): void => {
  if (!state.suppressAllOutput) console[type](message);
};

/**
 * Print string without formatting, after prompt has settled
 */
const createAsyncFn = (type: 'log' | 'error' = 'log') => async (message: string): Promise<void> => {
  await state.promptSettled;
  if (!state.suppressAllOutput) console[type](message);
};

function onlyIfVerbose(this: any, rawStrings: TemplateStringsArray, ...variables: TaggedVars) {
  if (state.verbose) return this(rawStrings, ...variables);
}

function withDefaultColor<T>(fn: TemplateFn<T>, defaultColor: Color): TemplateFn<T> {
  return function (rawStrings: TemplateStringsArray, ...vars: TaggedVars) {
    const varsWithColor = isColor(vars[vars.length - 1]) ? vars : [...vars, defaultColor];
    return fn(rawStrings, ...varsWithColor);
  };
}

function createPrintFunctions(): { stdout: Stdout; stderr: Stderr } {
  const formatRed = withDefaultColor(formatMessage, Color.RED);

  const stdoutRawSync = createSyncFn();

  const stdoutRaw = createAsyncFn();
  const stderrRaw = createAsyncFn('error');

  const stdout: any = (rawStrings: TemplateStringsArray, ...variables: TaggedVars) =>
    stdoutRaw(formatMessage(rawStrings, ...variables));

  const stderr: any = (rawStrings: TemplateStringsArray, ...variables: TaggedVars) =>
    stderrRaw(formatRed(rawStrings, ...variables));

  stdout.verbose = withDefaultColor(onlyIfVerbose.bind(stdout), Color.YELLOW);
  stderr.verbose = onlyIfVerbose;

  stdout.success = withDefaultColor(stdout, Color.GREEN);
  stdout.verbose.success = withDefaultColor(onlyIfVerbose.bind(stdout), Color.GREEN);

  stdout.raw = stdoutRaw;
  stderr.raw = stderrRaw;

  stdout.raw.sync = stdoutRawSync;
  stderr.raw.sync = createSyncFn('error');

  stdout.sync = (rawStrings: TemplateStringsArray, ...variables: TaggedVars) =>
    stdoutRawSync(formatMessage(rawStrings, ...variables));

  return { stdout, stderr };
}

export const { stdout, stderr } = createPrintFunctions();

export const printResult = (result: GetContentResult, numTargets: number): Promise<void> =>
  stdout.raw(formatResult(result, numTargets > 1));

export const printAllResults = (results: GetContentResult[]): Promise<void> | void => {
  const formatted = formatAllResults(results);
  if (formatted) return stdout.raw(formatted);
};
