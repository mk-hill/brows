import axios from 'axios';
import { JSDOM } from 'jsdom';

import { Target } from '../targets';
import { stdout } from '../stdio';

import { GetContentResult } from '.';
import { ElementNotFoundError } from './ElementNotFoundError';

const documents: Record<string, Promise<Document>> = {};

export async function getContentFromResponse(target: Readonly<Target>): Promise<GetContentResult> {
  const { name, url, selector, contentType, allMatches, delim } = target;
  const resultProps = { name, contentType, allMatches, delim };

  const title = name || selector;

  if (!documents[url]) {
    stdout.verbose`Making GET request for ${title}: ${url}`;
    documents[url] = axios({ url, responseType: 'text' })
      .then((res) => {
        stdout.verbose.success`Received response from: ${url}`;
        return new JSDOM(res.data).window.document;
      })
      .catch((e) => {
        throw new Error(e.message);
      });
  } else {
    stdout.verbose.success`Using previous request for ${title}: ${url}`;
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
  if (!condition) {
    throw new ElementNotFoundError(url, selector);
  } else {
    stdout.verbose.success`Found ${name || selector} in response data`;
  }
}
