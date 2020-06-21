#!/usr/bin/env node

import meow from 'meow';

import brows, { closeBrowser, Result } from '.';
import { options as defaults } from './defaults';
import { highlight, formatResults } from './util';

const cli = meow(
  `
    ${highlight('Usage')}
    brows accepts either one URL followed by one selector, or any number of saved target names

      $ brows [options] <url> <selector> 
      $ brows [options] <name> [<name> ...] 
    
    ${highlight('Options')}
      -s, --save <name>     Save target or group for future use with given name
      --save-only <name>    Save target or group and exit without retrieving content 
      -l, --list-saved      List saved targets and groups in alphabetical order
      -h, --html            Retrieve target's outer HTML instead of its text content
      -f, --force-browser   Prevent request attempt and force browser launch
      -o, --ordered         Print results in the order their targets were passed
      -v, --verbose         Print information about about what is being done  
      --help                Display this message

      --list-saved can be used without any other input to only perform its task and exit 
      without retrieving any content.
        
    ${highlight('Saving Targets')}
      Content type and browser preferences are saved with each individual target.
      Multiple saved target names can be used at a time, and grouped under a different name.
    
    ${highlight('Groups')}
      When saving multiple groups under one new group or retrieving content from multiple 
      groups, each child group will expand to its members in the order they were saved. 
      Any duplicate targets will be ignored.

    ${highlight('Details')}
      By default, brows will initially make a GET request to the URL and attempt to find the 
      selector in the response HTML. If this fails, a headless browser will be used instead.

      If a saved target isn't found in the response data on the first attempt, it will be 
      automatically updated to skip the unnecessary request and directly launch the browser
      in the future.

      When multiple saved target names are passed, brows will only make a request (and/or 
      navigate a browser page) to each URL once. All targets in the same URL will be 
      retrieved from the same response data and/or page.

      By default, results are printed as they are retrieved. Using --ordered will force brows
      to wait for all results and print them in the order their targets were passed instead.

      Conventional HTTP_PROXY/HTTPS_PROXY/NO_PROXY environment variables are used if available.

      See README for examples: https://github.com/mk-hill/brows#readme
`,
  {
    description: 'Retrieve content from the first HTML element matching CSS selector in URL for each target',
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
  .then((result: Result) => {
    closeBrowser();
    if (cli.flags.ordered) {
      const message = formatResults(result);
      if (message.trim()) console.log(message);
    }
  })
  .catch((e) => {
    const suggestVerbose = `Try repeating the command with the '${highlight('--verbose')}' option to see what's going wrong`;
    const suggestHelp = `or using '${highlight('brows --help')}' for a detailed explanation of usage and options`;
    console.error(`${e.message}\n${suggestVerbose},\n${suggestHelp}.`);
    closeBrowser().then(() => process.exit(1));
  });
