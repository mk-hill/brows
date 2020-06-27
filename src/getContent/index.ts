import { getContentFromResponse } from './request';
import { getContentFromBrowser } from './browser';
import { Target, updateSavedTarget, ContentType } from '../targets';
import { ElementNotFoundError } from './ElementNotFoundError';
import { highlight, printIfVerbose } from '../util';
import state from '../state';

export { launchBrowser, closeBrowser } from './browser';

export interface GetContentResult {
  name?: string;
  content: string | string[];
  contentType: ContentType;
  allMatches: boolean;
  delim: string;
}

const { stdout, stderr } = printIfVerbose;

export async function getContent(target: Target): Promise<GetContentResult> {
  const { name, url, forceBrowser } = target;

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
        if (state.hasPrompt) {
          state.promptResolved
            ?.then(updateForceBrowser.bind(null, name))
            ?.catch(() => stdout('Aborted automatic forceBrowser update as overwrite was declined'));
        } else {
          updateForceBrowser(name);
        }
      }
    }
  } else {
    stdout(`Skipping request attempt for ${title}`);
  }

  stdout(`Retrieving ${title} content from browser`);
  return getContentFromBrowser(target);
}

const updateForceBrowser = (name: string) =>
  updateSavedTarget(name, { forceBrowser: true }).then(() =>
    stdout(`Updated saved target ${highlight(name)} to skip request attempt in the future`)
  );
