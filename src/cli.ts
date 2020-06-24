import meow from 'meow';

import brows, { closeBrowser } from '.';
import { options as defaults } from './defaults';
import { highlight } from './util';

const cli = meow(
  `
    ${highlight('Usage')}
    brows accepts either one URL followed by one selector, or any number of saved target names

      $ brows [options] <url> <selector> 
      $ brows [options] <name> [<name> ...] 
    
    ${highlight('Options')}
      -s, --save <name>       Save target or group for future use with given name
      --save-only <name>      Save target or group and exit without retrieving content 
      -h, --html              Retrieve target's outer HTML instead of its text content
      -a, --all-matches       Target all matching elements instead of just the first one
      -d, --delim <string>    Set delimiter between results for -a. Defaults to newline
      -f, --force-browser     Prevent request attempt and force browser launch
      -l, --list-saved        Print a list of all saved targets and groups
      -i, --import <source>   Import targets and groups from source file  
      -e, --export <target>   Export all saved targets and groups to target file
      -o, --ordered-print     Print results in the order their targets were passed
      -v, --verbose           Print information about about what is being done  
      --help                  Display this message

      --list-saved, --import, and --export can be used without any other input to only 
      perform their task and exit without retrieving any content.
        
    ${highlight('Saving Targets')}
      Content type and browser preferences are saved with each individual target.
      Multiple saved target names can be used at a time, and grouped under a different name.
    
    ${highlight('Groups')}
      Saving multiple targets with a new name will create a group. Groups are essentially
      aliases which expand to their member targets in the order they were passed when saving.
      When saving or retrieving content from multiple overlapping groups, each target is
      only used once. No duplicates will be retrieved or saved under the new combined group.

    ${highlight('Import/Export')}
      brows uses YAML for imports and exports by default. Importing JSON files with the
      same structure is also allowed. Path to source/target file can be relative or absolute.

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

      See README for examples and further details: https://github.com/mk-hill/brows#readme
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
      html: {
        type: 'boolean',
        alias: 'h',
        default: defaults.html,
      },
      allMatches: {
        type: 'boolean',
        alias: 'a',
        default: defaults.allMatches,
      },
      delim: {
        type: 'string',
        alias: 'd',
        default: defaults.delim,
      },
      forceBrowser: {
        type: 'boolean',
        alias: 'f',
        default: defaults.forceBrowser,
      },
      listSaved: {
        type: 'boolean',
        alias: 'l',
        default: defaults.listSaved,
      },
      import: {
        type: 'string',
        alias: 'i',
        default: defaults.import,
      },
      export: {
        type: 'string',
        alias: 'e',
        default: defaults.export,
      },
      orderedPrint: {
        type: 'boolean',
        alias: 'o',
        default: defaults.orderedPrint,
      },
      verbose: {
        type: 'boolean',
        alias: 'v',
        default: defaults.verbose,
      },

      // Renamed to orderedPrint, support until next major version
      ordered: {
        type: 'boolean',
        default: defaults.orderedPrint,
      },
    },
  }
);

export interface Flags {
  save: string;
  saveOnly: string;
  html: boolean;
  forceBrowser: boolean;
  listSaved: boolean;
  import: string;
  export: string;
  orderedPrint: boolean;
  verbose: boolean;
}

export async function run(): Promise<void> {
  try {
    const { input, flags: cliFlags } = cli;
    const { ordered, orderedPrint, ...rest } = cliFlags;

    if (ordered) {
      console.warn(`--ordered has been renamed to --ordered-print. Support will be dropped in a future version.`);
    }

    const flags: Flags = { orderedPrint: ordered || orderedPrint, ...rest };
    await brows(...input, flags);
    closeBrowser();
  } catch (e) {
    const suggestVerbose = `Try repeating the command with the '${highlight('--verbose')}' option to see what's going wrong`;
    const suggestHelp = `or using '${highlight('brows --help')}' for a detailed explanation of usage and options`;
    console.error(`${e.message}\n${suggestVerbose},\n${suggestHelp}.`);
    closeBrowser().then(() => process.exit(1));
  }
}
