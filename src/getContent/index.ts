import { getContentFromResponse } from './request';
import { getContentFromBrowser } from './browser';
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
      return await getContentFromResponse(target, options);
    } catch (error) {
      const message =
        error instanceof ElementNotFoundError ? `Element not found in` : `Received error "${error.message}" while requesting`;
      stderr(`${message} ${title} response data, using browser`);

      if (name && !forceBrowser) {
        updateSavedTarget(name, { forceBrowser: true }).then(() =>
          stdout(`Updated saved target ${highlight(name)} to skip request attempt in the future`)
        );
      }
    }
  } else {
    stdout(`Skipping request attempt for ${title}`);
  }

  stdout(`Retrieving ${title} content from browser`);
  return getContentFromBrowser(target, options);
}
