#!/usr/bin/env node

import meow from 'meow';

import { brows } from '.';
import { closeBrowser } from './getContent';
import { highlight } from './util';

const cli = meow(
  `
    Usage
      $ brows [options] <url> <selector> 
      $ brows [options] <name> [<name> ...] 
    
    Options
      -s, --save <name>     Save input for future use with given name
                            multiple saved names can be used at a time,
                            and grouped under a different name
      --save-only <name>    Save input and exit without retrieving content   
      -l, --list-saved      List saved options in alphabetical order
                            can be used without input to only list and exit
      -h, --html            Retrieve outer HTML instead of text content
                            content type will be saved if save option is used
      -f, --force-browser   Prevent fetch attempt and force browser launch 
                            will be updated automatically on saved options if
                            fetch attempt fails, can also be saved manually
      -v, --verbose         Print additional details about what is being done
                            not saved, determined separately for each run

    By default, will initially attempt to retrieve content from fetched HTML
    If this fails, a headless browser will be used instead

    Previously fetched URL contents and launched browser pages will be 
    reused if multiple saved names which target the same URL are passed 
`,
  {
    description: 'Retrieve contents of the first HTML element matching CSS selector in URL',
    flags: {
      save: {
        type: 'string',
        alias: 's',
      },
      saveOnly: {
        type: 'string',
      },
      listSaved: {
        type: 'boolean',
        alias: 'l',
        default: false,
      },
      html: {
        type: 'boolean',
        alias: 'h',
        default: false,
      },
      forceBrowser: {
        type: 'boolean',
        alias: 'f',
        default: false,
      },
      verbose: {
        type: 'boolean',
        alias: 'v',
        default: false,
      },
    },
  }
);

brows(cli)
  .then((results) => {
    if (results) console.log(results);
    closeBrowser();
  })
  .catch((e) => {
    console.error(e.message + `\nTry '${highlight('brows --help')}' for more information`);
    closeBrowser().then(() => process.exit(1));
  });

export type CLI = typeof cli;
