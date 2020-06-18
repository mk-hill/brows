import { fetchContents } from './fetch';
import { getContentsFromBrowser } from './browser';
import { BrowsOptions, updateSavedOptions } from '../targets';
import { ElementNotFoundError } from './ElementNotFoundError';
import { highlight, printIf } from '../util';

export { launchBrowser, closeBrowser } from './browser';

export async function getContent({ forceBrowser, ...options }: BrowsOptions): Promise<string> {
  const { verbose, name, url } = options;
  const { stdout, stderr } = printIf(verbose);
  const title = highlight(name || url);

  if (!forceBrowser) {
    try {
      return await fetchContents(options);
    } catch (error) {
      const message =
        error instanceof ElementNotFoundError
          ? `Element not found in fetched`
          : `Received error "${error.message}" while attempting to fetch`;
      stderr(`${message} ${title} content, using browser`);

      if (name && !forceBrowser) {
        updateSavedOptions(name, { forceBrowser: true }).then(() =>
          stdout(`Updated saved ${highlight(name)} options to skip fetch attempt in the future`)
        );
      }
    }
  } else {
    stdout(`Skipping fetch attempt for ${title}`);
  }

  stdout(`Retrieving ${title} content from browser`);
  return getContentsFromBrowser(options);
}
