#!/usr/bin/env node

import meow from 'meow';

import brows, { closeBrowser } from '.';
import { options as defaults } from './defaults';
import { highlight, formatResult } from './util';

const cli = meow(
  `
    Usage
      $ brows [options] <url> <selector> 
      $ brows [options] <name> [<name> ...] 
    
    Options
      -s, --save <name>     Save target for future use with given name
                            multiple saved names can be used at a time,
                            and grouped under a different name
      --save-only <name>    Save input and exit without retrieving content   
      -l, --list-saved      List saved targets in alphabetical order
                            can be used without input to only list and exit
      -h, --html            Retrieve outer HTML instead of text content
                            content type will be saved if save option is used
      -f, --force-browser   Prevent fetch attempt and force browser launch 
                            will be updated automatically on saved targets if
                            fetch attempt fails, can also be saved manually
      -v, --verbose         Print additional details about what is being done
                            not saved, determined separately for each run

    By default, will initially attempt to retrieve content from fetched HTML
    If this fails, a headless browser will be used instead

    Previously fetched URL contents and launched browser pages will be 
    reused if multiple saved names which target the same URL are passed 
`,
  {
    description: 'Retrieve content from the first HTML element matching CSS selector in URL',
    flags: {
      save: {
        type: 'string',
        alias: 's',
        default: defaults.save,
      },
      saveOnly: {
        type: 'string',
        default: defaults.saveOnly,
      },
      listSaved: {
        type: 'boolean',
        alias: 'l',
        default: defaults.listSaved,
      },
      html: {
        type: 'boolean',
        alias: 'h',
        default: defaults.html,
      },
      forceBrowser: {
        type: 'boolean',
        alias: 'f',
        default: defaults.forceBrowser,
      },
      verbose: {
        type: 'boolean',
        alias: 'v',
        default: defaults.verbose,
      },
    },
  }
);

brows(...cli.input, cli.flags)
  .then((results) => {
    const message = formatResult(results);
    if (message.trim()) console.log(message);
    closeBrowser();
  })
  .catch((e) => {
    console.error(e.message + `\nTry '${highlight('brows --help')}' for more information`);
    closeBrowser().then(() => process.exit(1));
  });
