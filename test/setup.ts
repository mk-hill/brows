import { resolve } from 'path';
import * as defaults from '../src/defaults';

export const urls = {
  unformatted: 'info.cern.ch/hypertext/WWW/TheProject.html',
  fetch: 'http://info.cern.ch/hypertext/WWW/TheProject.html',
  spa: 'http://todomvc.com/examples/react/',
};

export const selectors = {
  dt: 'dt',
  h1: 'h1',
  itemsInFirstList: 'ul:first-of-type li',
};

export const names = {
  default: defaults.targetName,
  delim: 'delim',
  fetchText: 'fetchText',
  fetchHtml: 'fetchHtml',
  fetchAllText: 'fetchAllText',
  fetchAllHtml: 'fetchAllHtml',
  spaText: 'spaText',
  spaHtml: 'spaHtml',
  spaAllText: 'spaAllText',
  spaAllHtml: 'spaAllHtml',
  textGroup: 'textGroup',
  htmlGroup: 'htmlGroup',
  allTextGroup: 'allTextGroup',
  allHtmlGroup: 'allHtmlGroup',
  fetchGroup: 'fetchGroup',
  combinedGroups: 'combinedGroups',
  overlappingGroups: 'overlappingGroups',
};

export const results = {
  fetchText: 'World Wide Web',
  fetchHtml: `<h1>World Wide Web</h1>`,
  fetchAllText: [
    "What's out there?",
    'Help',
    'Software Products',
    'Technical',
    'Bibliography',
    'People',
    'History',
    'How can I help ?',
    'Getting code',
  ],
  fetchAllHtml: [
    '<dt><a name="44" href="../DataSources/Top.html">What\'s out there?</a>\n</dt>',
    '<dt><a name="46" href="Help.html">Help</a>\n</dt>',
    '<dt><a name="13" href="Status.html">Software Products</a>\n</dt>',
    '<dt><a name="47" href="Technical.html">Technical</a>\n</dt>',
    '<dt><a name="40" href="Bibliography.html">Bibliography</a>\n</dt>',
    '<dt><a name="14" href="People.html">People</a>\n</dt>',
    '<dt><a name="15" href="History.html">History</a>\n</dt>',
    '<dt><a name="37" href="Helping.html">How can I help</a> ?\n</dt>',
    '<dt><a name="48" href="../README.html">Getting code</a>\n</dt>',
  ],
  spaText: 'todos',
  spaHtml: `<h1 data-reactid=".0.0.0">todos</h1>`,
  spaAllText: ['Tutorial', 'Philosophy', 'Support', 'Flux architecture example'],
  spaAllHtml: [
    '<li> <a href="http://facebook.github.io/react/docs/tutorial.html">Tutorial</a> </li>',
    '<li> <a href="http://www.quora.com/Pete-Hunt/Posts/React-Under-the-Hood">Philosophy</a> </li>',
    '<li> <a href="http://facebook.github.io/react/support.html">Support</a> </li>',
    '<li> <a href="https://github.com/facebook/flux/tree/master/examples/flux-todomvc">Flux architecture example</a> </li>',
  ],
};

export const paths = {
  exportRelative: 'testExport1.yml',
  exportAbsolute: resolve(process.cwd(), 'testExport2.yml'),
};
