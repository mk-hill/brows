import { getContentFromResponse } from './request';
import { getContentFromBrowser } from './browser';
import { Target, updateSavedTarget } from '../targets';
import { ElementNotFoundError } from './ElementNotFoundError';
import { highlight, printIfVerbose } from '../util';

export { launchBrowser, closeBrowser } from './browser';

export interface GetContentResult {
  name?: string;
  content: string;
}

export async function getContent(target: Target): Promise<GetContentResult> {
  const { name, url, forceBrowser } = target;
  const { stdout, stderr } = printIfVerbose;

  const title = highlight(name || url);

  if (!forceBrowser) {
    try {
      return await getContentFromResponse(target);
    } catch (error) {
      const message =
        error instanceof ElementNotFoundError
          ? `Element not found in`
          : `Received error "${error.message}" while attempting to retrieve`;
      stderr(`${message} ${title} response, using browser`);

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
  return getContentFromBrowser(target);
}
