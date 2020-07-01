import { Target, updateSavedTarget, ContentType } from '../targets';
import { stdout, stderr, Color } from '../stdio';
import state from '../state';

import { getContentFromResponse } from './request';
import { getContentFromBrowser } from './browser';
import { ElementNotFoundError } from './ElementNotFoundError';

export { launchBrowser, closeBrowser } from './browser';

export interface GetContentResult {
  name?: string;
  content: string | string[];
  contentType: ContentType;
  allMatches: boolean;
  delim: string;
}

export async function getContent(target: Target): Promise<GetContentResult> {
  const { name, url, selector, forceBrowser } = target;

  const title = name || selector;

  if (!forceBrowser) {
    try {
      return await getContentFromResponse(target);
    } catch (error) {
      if (error instanceof ElementNotFoundError) {
        stderr.verbose`Element not found in response from: ${url}`;
      } else {
        stderr.verbose`Something went wrong with request to: ${url}
                       Unable to retrieve HTML content: 
                       ${[error.message, Color.RED]}`;
      }
      stdout.verbose`Using browser for ${title} instead`;

      if (name && !forceBrowser) {
        if (state.hasPrompt) {
          state.promptResolved?.then(updateForceBrowser.bind(null, name))?.catch(() => {
            stdout.verbose`Aborted automatic forceBrowser update as overwrite was declined`;
          });
        } else {
          updateForceBrowser(name);
        }
      }
    }
  } else {
    stdout.verbose`Skipping request attempt for ${title}`;
  }

  stdout.verbose`Retrieving ${title} content from browser`;
  return getContentFromBrowser(target);
}

const updateForceBrowser = (name: string) =>
  updateSavedTarget(name, { forceBrowser: true }).then(() => {
    stdout.verbose.success`Updated saved target ${name} to skip request attempt in the future`;
  });
