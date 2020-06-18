import { fetchContents } from './fetch';
import { getContentsFromBrowser } from './browser';
import { Target, updateSavedTarget } from '../targets';
import { ElementNotFoundError } from './ElementNotFoundError';
import { highlight, printIf } from '../util';
import { RunOptions } from '../options';

export { launchBrowser, closeBrowser } from './browser';

export async function getContent(target: Target, options: Readonly<RunOptions>): Promise<string> {
  const { name, url, forceBrowser } = target;
  const { stdout, stderr } = printIf(options.verbose);

  const title = highlight(name || url);

  if (!forceBrowser) {
    try {
      return await fetchContents(target, options);
    } catch (error) {
      const message =
        error instanceof ElementNotFoundError
          ? `Element not found in fetched`
          : `Received error "${error.message}" while attempting to fetch`;
      stderr(`${message} ${title} content, using browser`);

      if (name && !forceBrowser) {
        updateSavedTarget(name, { forceBrowser: true }).then(() =>
          stdout(`Updated saved ${highlight(name)} target to skip fetch attempt in the future`)
        );
      }
    }
  } else {
    stdout(`Skipping fetch attempt for ${title}`);
  }

  stdout(`Retrieving ${title} content from browser`);
  return getContentsFromBrowser(target, options);
}
