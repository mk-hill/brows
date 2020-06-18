import { targetName as defaultName } from '../src/defaults';

export const urls = {
  unformatted: 'info.cern.ch/hypertext/WWW/TheProject.html',
  fetch: 'http://info.cern.ch/hypertext/WWW/TheProject.html',
  spa: 'http://todomvc.com/examples/react/',
};

export const selectors = {
  h1: 'h1',
};

export const names = {
  default: defaultName,
  fetchText: 'fetchText',
  fetchHtml: 'fetchHtml',
  spaText: 'spaText',
  spaHtml: 'spaHtml',
  textParent: 'textParent',
  htmlParent: 'htmlParent',
  fetchParent: 'fetchParent',
  combinedParents: 'combinedParents',
  overlappingParents: 'overlappingParents',
};

export const results = {
  fetchText: 'World Wide Web',
  fetchHtml: `<h1>World Wide Web</h1>`,
  spaText: 'todos',
  spaHtml: `<h1 data-reactid=".0.0.0">todos</h1>`,
};
