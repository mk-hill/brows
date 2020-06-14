import path from 'path';
import { readFileSync } from 'fs';

import type { CLI } from '../src/cli';

export const options: Record<string, CLI> = JSON.parse(readFileSync(path.resolve(__dirname, 'options.json'), 'utf8'));

const defaultFlags = { save: '', html: false, verbose: false, forceBrowser: false };

Object.keys(options).forEach((key) => {
  options[key] = { ...options[key], flags: { ...defaultFlags, ...options[key].flags } };
});

const fetchText = 'World Wide Web';
const fetchHtml = new RegExp(`<h1.*>${fetchText}</h1>`);

const spaText = 'todos';
const spaHtml = new RegExp(`<h1.*>${spaText}</h1>`);

export const results = {
  fetchText,
  fetchHtml,
  spaText,
  spaHtml,
};
