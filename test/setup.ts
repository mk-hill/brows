import { resolve } from 'path';
import * as defaults from '../src/defaults';

defaults.options.orderedPrint = true;

export const urls = {
  unformatted: 'info.cern.ch/hypertext/WWW/TheProject.html',
  fetch: 'http://info.cern.ch/hypertext/WWW/TheProject.html',
  spa: 'http://todomvc.com/examples/react/',
};

export const selectors = {
  h1: 'h1',
};

export const names = {
  default: defaults.targetName,
  fetchText: 'fetchText',
  fetchHtml: 'fetchHtml',
  spaText: 'spaText',
  spaHtml: 'spaHtml',
  textGroup: 'textGroup',
  htmlGroup: 'htmlGroup',
  fetchGroup: 'fetchGroup',
  combinedGroups: 'combinedGroups',
  overlappingGroups: 'overlappingGroups',
};

export const results = {
  fetchText: 'World Wide Web',
  fetchHtml: `<h1>World Wide Web</h1>`,
  spaText: 'todos',
  spaHtml: `<h1 data-reactid=".0.0.0">todos</h1>`,
};

export const paths = {
  exportRelative: 'testExport1.yml',
  exportAbsolute: resolve(process.cwd(), 'testExport2.yml'),
};
