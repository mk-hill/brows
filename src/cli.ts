#!/usr/bin/env node

import meow from 'meow';

import { brows } from '.';
import { closeBrowser } from './getContent';
import { highlight } from './util';

const cli = meow(
  `
    Usage
      $ brows <url> <selector>
      $ brows <url> <selector> -s <name>
      $ brows <name>
      $ brows <name> <name> ...
    
    Options
      -s, --save <name>     Save input for future use with given name
                            multiple saved names can be used at a time
      -v, --verbose         Print additional details about what is being done
                            not saved, determined separately for each run
      -h, --html            Return element's outer HTML instead of its text content
                            content type will be saved if save option is used
      -f, --force-browser   Prevent initial fetch attempt and force browser launch 
                            will be updated automatically on saved options if
                            fetch attempt fails, can also be saved manually

    By default, will initially attempt to retrieve content from fetched HTML
    If this fails, a headless browser will be used instead

    Previously fetched URL contents and launched browser pages will be 
    reused if multiple saved names which target the same URL are passed 
`,
  {
    description: 'Retrieve contents of the first HTML element matching a CSS selector in a URL',
    flags: {
      save: {
        type: 'string',
        alias: 's',
      },
      verbose: {
        type: 'boolean',
        alias: 'v',
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
    },
  }
);

brows(cli)
  .then((results) => {
    console.log(results);
    closeBrowser();
  })
  .catch((e) => {
    console.error(e.message + `\nTry '${highlight('brows --help')}' for more information`);
    closeBrowser().then(() => process.exit(1));
  });

export type CLI = typeof cli;
