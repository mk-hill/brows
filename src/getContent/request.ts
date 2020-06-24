import axios from 'axios';
import { JSDOM } from 'jsdom';

import { Target } from '../targets';
import { printIfVerbose, highlight } from '../util';

import { ElementNotFoundError } from './ElementNotFoundError';
import { GetContentResult } from '.';

const documents: Record<string, Promise<Document>> = {};

const { stdout } = printIfVerbose;

export async function getContentFromResponse(target: Readonly<Target>): Promise<GetContentResult> {
  const { name, url, selector, contentType, allMatches, delim } = target;
  const resultProps = { name, contentType, allMatches, delim };

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

  if (allMatches) {
    const elements = document.querySelectorAll(selector);

    throwIfNotFound(target, !!elements?.length);

    const content = [...elements].map((el) => el?.[contentType]?.trim()).filter(Boolean) as string[];
    return { ...resultProps, content };
  }
  const element = document.querySelector(selector);

  throwIfNotFound(target, !!element);
  const content = element?.[contentType]?.trim() ?? '';
  return { ...resultProps, content };
}

function throwIfNotFound({ url, selector, name }: Target, condition: boolean) {
  const title = highlight(name || selector);
  if (!condition) {
    throw new ElementNotFoundError(url, selector);
  } else {
    stdout(`Found ${title} in ${name ? '' : highlight(url) + ' '}response data`);
  }
}
