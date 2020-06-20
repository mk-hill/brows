import axios from 'axios';
import { JSDOM } from 'jsdom';

import { Target } from '../targets';
import { printIf, highlight } from '../util';
import { ElementNotFoundError } from './ElementNotFoundError';
import { RunOptions } from '../options';

const documents: Record<string, Promise<Document>> = {};

export async function getContentFromResponse(target: Readonly<Target>, { verbose }: Readonly<RunOptions>): Promise<string> {
  const { url, selector, contentType, name } = target;
  const { stdout } = printIf(verbose);

  const title = highlight(name || selector);

  if (!documents[url]) {
    stdout(`Requesting ${highlight(url)} content for ${title}`);
    documents[url] = axios({ url, responseType: 'text' })
      .then((res) => {
        stdout(`Received response from ${highlight(url)}`);
        return new JSDOM(res.data).window.document;
      })
      .catch((e) => {
        throw new Error(`Unable to retrieve HTML content: ${e.message}`);
      });
  } else {
    stdout(`Using existing ${highlight(url)} request for ${title}`);
  }

  const document = await documents[url];
  const element = document.querySelector(selector);

  if (!element) {
    throw new ElementNotFoundError(url, selector);
  } else {
    stdout(`Found ${title} in ${name ? '' : highlight(url) + ' '}response data`);
  }

  return element[contentType] ?? '';
}
