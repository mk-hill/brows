#!/usr/bin/env node

import meow from 'meow';

import brows, { closeBrowser } from '.';
import { options as defaults } from './defaults';
import { highlight, formatResults } from './util';

const cli = meow(
  `
    Usage
      $ brows [options] <url> <selector> 
      $ brows [options] <name> [<name> ...] 
    
    Options
      -s, --save <name>     Save target for future use with given name
                            multiple saved names can be used at a time,
                            and grouped under a different name
      --save-only <name>    Save target and exit without retrieving content 
      -l, --list-saved      List saved targets in alphabetical order
                            can be used without input to only list and exit
      -h, --html            Retrieve outer HTML instead of text content
                            content type will be saved if save option is used
      -f, --force-browser   Prevent GET request and force browser launch 
                            will be updated automatically on saved targets if
                            initial attempt fails, can also be saved manually
      -o, --ordered         Wait for all content and print results in the 
                            order they were passed. groups will expand to 
                            their members in the order they were saved
      -v, --verbose         Print additional details about what is being done  
      --help                Display this message

    By default, brows will initially make a GET request to the URL and
    attempt to find the selector in the response HTML. If this fails, 
    a headless browser will be used instead.

    When multiple saved names are passed, brows will only make a request
    (and/or navigate a browser page) to each URL once. 
    All targets in the same URL will be retrieved from the same response 
    data and/or browser page.
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
      ordered: {
        type: 'boolean',
        alias: 'o',
        default: defaults.ordered,
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
    if (cli.flags.ordered) {
      const message = formatResults(results);
      if (message.trim()) console.log(message);
    }
    closeBrowser();
  })
  .catch((e) => {
    console.error(e.message + `\nTry '${highlight('brows --help')}' for more information`);
    closeBrowser().then(() => process.exit(1));
  });
