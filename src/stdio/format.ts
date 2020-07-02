import pretty from 'pretty';

import { GetContentResult } from '../getContent';
import state from '../state';

import { Color, isColor, Coercible, TaggedVars } from './types';
import { error } from '../util';

const prefix = '\x1b[';

const trim = (x: Coercible) => x?.toString()?.trim() ?? '';

export const highlight = (c: Coercible, color: Color = Color.CYAN): string => {
  if (Array.isArray(c)) return c.map((element) => highlight(trim(element), color)).join(', ');
  if (!trim(c)) return '';
  if (c?.toString()?.startsWith(prefix) || color === Color.NONE) return c.toString();
  return `${prefix}${color}m${c}\x1b[0m`;
};

const unindentLines = (str: string) =>
  str
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

/**
 * Take tagged template
 * Highlight all variables: if Array with length of 2 and second item as color use given color,
 * otherwise use default color (dim for URLs, cyan for everything else)
 * Optionally take a final Color variable with which to highlight all raw strings
 */
export function formatMessage(rawStrings: TemplateStringsArray, ...variables: TaggedVars): string {
  let colorAllRaw;
  if (isColor(variables[variables.length - 1])) {
    colorAllRaw = (variables.splice(variables.length - 1, 1) as unknown) as Color;
  }

  const highlights = variables.map((variable) => {
    if (Array.isArray(variable)) {
      if (variable.length === 2 && isColor(variable[1])) {
        const [s, color] = variable;
        return highlight(s, color);
      }
      return highlight(variable);
    }

    const isUrl = ['http://', 'https://'].some((protocol) => variable?.toString()?.startsWith(protocol));

    return isUrl ? highlight(trim(variable), Color.DIM) : highlight(trim(variable));
  });

  const iterations = Math.max(rawStrings.length, highlights.length);

  let combined = '';
  for (let i = 0; i < iterations; i++) {
    if (rawStrings[i]) combined += colorAllRaw ? highlight(rawStrings[i], colorAllRaw) : rawStrings[i];
    if (highlights[i]) combined += highlights[i];
  }

  return unindentLines(combined).trim();
}

const formatResultContent = (result: GetContentResult, indent = 0, isFirstElement = true): string => {
  const { content, delim } = result;
  if (!Array.isArray(content)) {
    const formatted = pretty(content, { ocd: true })
      .split('\n')
      // indent every line except the first line of the first element's content
      .map((line, i) => ' '.repeat(isFirstElement && !i ? 0 : indent) + line)
      .filter((line) => line.trim())
      .join('\n');

    return state.verbose ? highlight(formatted, Color.BRIGHT) : formatted;
  }

  const indentEachResult = delim.includes('\n') ? indent : 0;

  return content
    .filter((singleElementContent) => singleElementContent.trim())
    .map((s, i) => formatResultContent({ ...result, content: s }, indentEachResult, i === 0))
    .join(delim);
};

export const formatResult = (result: GetContentResult, includeName: boolean): string => {
  const { name } = result;
  if (!name && includeName) throw error`No name to include in formatted result`;
  let prefix = '';
  let indent = 0;

  if (includeName) {
    const s = ': ';
    prefix = highlight(name as string) + s;
    indent = (name?.length ?? 0) + s.length;
  }

  const formattedContent = formatResultContent(result, indent);

  return (prefix + formattedContent).trim();
};

export const formatAllResults = (results: GetContentResult[]): string =>
  results
    .map((result) => formatResult(result, results.length > 1))
    .join('\n')
    .trim();
