import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

import { Target } from '../targets';
import { printIf, highlight } from '../util';
import { ElementNotFoundError } from './ElementNotFoundError';
import { RunOptions } from '../options';

const documents: Record<string, Promise<Document>> = {};

export async function fetchContents(target: Readonly<Target>, { verbose }: Readonly<RunOptions>): Promise<string> {
  const { url, selector, contentType, name } = target;
  const { stdout } = printIf(verbose);

  const title = highlight(name || selector);

  if (!documents[url]) {
    stdout(`Fetching ${highlight(url)} content for ${title}`);
    documents[url] = fetch(url)
      .catch((e) => {
        throw new Error(`Unable to fetch HTML content: ${e.message}`);
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Received response ${res.status}`);
        }
        stdout(`Fetched ${highlight(url)} content`);
        return res.text();
      })
      .then((html) => new JSDOM(html).window.document);
  } else {
    stdout(`Using previous ${highlight(url)} fetch for ${title}`);
  }

  const document = await documents[url];
  const element = document.querySelector(selector);

  if (!element) {
    throw new ElementNotFoundError(url, selector);
  } else {
    stdout(
      name ? `Found ${highlight(name)} in fetched content` : `Found ${highlight(selector)} in fetched ${highlight(url)} content`
    );
  }

  return element[contentType] ?? '';
}
