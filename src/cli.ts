import meow from 'meow';

import brows, { closeBrowser } from '.';
import { options as defaults } from './defaults';
import { Options } from './options';
import { stdout, Color, stderr, highlight as h } from './stdio';

const cli = meow(
  `
    ${h('Usage', Color.YELLOW)}
    brows accepts either one URL followed by one selector, or any number of saved target names

      ${h('$ brows [options] <url> <selector>', Color.BRIGHT)} 
      ${h('$ brows [options] <name> [<name> ...]', Color.BRIGHT)} 
    
    ${h('Options', Color.YELLOW)}
      ${h('-s, --save <name>', Color.BRIGHT)}       Save target or group for future use with given name
      ${h('--save-only <name>', Color.BRIGHT)}      Save target or group and exit without retrieving content 
      ${h('-h, --html', Color.BRIGHT)}              Retrieve target's outer HTML instead of its text content
      ${h('-a, --all-matches', Color.BRIGHT)}       Target all matching elements instead of just the first one
      ${h('-d, --delim <string>', Color.BRIGHT)}    Set delimiter between results for -a. Defaults to newline
      ${h('-f, --force-browser', Color.BRIGHT)}     Prevent request attempt and force browser launch
      ${h('-l, --list-saved', Color.BRIGHT)}        Print a list of all saved targets and groups
      ${h('-i, --import <source>', Color.BRIGHT)}   Import targets and groups from source path  
      ${h('-e, --export <target>', Color.BRIGHT)}   Export all saved targets and groups to target path
      ${h('-o, --ordered-print', Color.BRIGHT)}     Print results in the order their targets were passed
      ${h('-v, --verbose', Color.BRIGHT)}           Print information about about what is being done
      ${h('-y, --yes', Color.BRIGHT)}               Accept any confirmation prompts without displaying them  
      ${h('--help', Color.BRIGHT)}                  Display this message

      --list-saved, --import, and --export can be used without any other input
        
    ${h('Saving Targets', Color.YELLOW)}
      ${h('Content type and browser preferences are saved', Color.BRIGHT)} with each individual target.
      You can use ${h('any number of saved targets at a time', Color.BRIGHT)}, and group them under a new name.
    
    ${h('Groups', Color.YELLOW)}
      ${h('Saving multiple targets with a new name will create a group', Color.BRIGHT)}. Groups are merely
      aliases which expand to their member targets in the order they were passed when saving.
      When using multiple overlapping groups, ${h('duplicates will be ignored.', Color.BRIGHT)}

    ${h('Import/Export', Color.YELLOW)}
      brows uses ${h('YAML', Color.BRIGHT)} for imports and exports by default. Importing JSON files with the
      same structure is also supported. Path to source/target can be relative or absolute.

    ${h('Additional Details', Color.YELLOW)}
      By default, ${h('brows will initially make a GET request', Color.BRIGHT)} to the URL and attempt to find the 
      selector in the response HTML. ${h('If this fails, a headless browser will be used', Color.BRIGHT)} instead.

      If a saved target isn't found in the response data on the first attempt, it will be 
      ${h('automatically updated to skip the unnecessary request', Color.BRIGHT)} in the future.

      brows will only make a request (and/or navigate a browser page) to ${h('each URL once', Color.BRIGHT)}, 
      regardless of how many targets are passed for the same URL.

      ${h('HTTP_PROXY/HTTPS_PROXY/NO_PROXY', Color.BRIGHT)} environment variables are used if available.

      See README for examples and further details: ${h('https://github.com/mk-hill/brows#readme', Color.BRIGHT)}
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
      yes: {
        type: 'boolean',
        alias: 'y',
        default: defaults.acceptAllPrompts,
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
  yes: boolean;
  verbose: boolean;
}

export async function run(): Promise<void> {
  try {
    const { input, flags: cliFlags } = cli;
    const { ordered, orderedPrint, yes, ...rest } = cliFlags;

    if (ordered) {
      stderr`--ordered has been renamed to ${['--ordered-print', Color.BRIGHT]}. Support will be dropped in a future version.`;
    }

    const options: Options = { orderedPrint: ordered || orderedPrint, acceptAllPrompts: yes, suppressAllOutput: false, ...rest };
    await brows(...input, options);
    closeBrowser();
  } catch (e) {
    const args = process.argv
      .slice(2)
      .filter((arg) => arg.trim() !== '-v')
      .map((arg) => (arg.startsWith('-') ? arg : `'${arg}'`))
      .join(' ');
    const commandWithVerbose = `brows -v ${args}`;

    stderr`${[e.message, Color.RED]}`;
    stdout`Try using ${['brows --help', Color.BRIGHT]} for a detailed explanation of usage and options,
           or repeating the command with the ${['--verbose', Color.BRIGHT]} option to see what's going wrong: 
           ${[commandWithVerbose, Color.BRIGHT]} ${Color.YELLOW}`;

    closeBrowser().then(() => process.exit(1));
  }
}
