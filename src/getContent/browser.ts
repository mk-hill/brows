import puppeteer, { Browser, Page } from 'puppeteer';
import { TimeoutError } from 'puppeteer/Errors';

import { Target } from '../targets';
import { highlight, printIfVerbose } from '../util';
import { ElementNotFoundError } from './ElementNotFoundError';
import { GetContentResult } from '.';

let browserPromise: Promise<Browser>;
const pages: Record<string, Promise<Page>> = {};

const { stdout } = printIfVerbose;

export async function getContentFromBrowser(target: Readonly<Target>): Promise<GetContentResult> {
  const { name, url, selector, contentType, allMatches, delim } = target;

  if (!browserPromise) launchBrowser();

  const browser = await browserPromise;

  const title = highlight(name || selector);

  if (!pages[url]) {
    stdout(`Opening ${highlight(url)} page in browser for ${title}`);
    pages[url] = browser.newPage().then((page) =>
      page.goto(url).then(() => {
        stdout(`Page navigation to ${highlight(url)} complete`);
        return page;
      })
    );
  } else {
    stdout(`Using existing ${highlight(url)} page for ${title}`);
  }

  const page = await pages[url];

  stdout(`Waiting for ${title} in browser page`);
  await page.waitForSelector(selector).catch((e) => {
    if (e instanceof TimeoutError) {
      throw new ElementNotFoundError(url, selector);
    }
    throw new Error(`Unable wait for selector "${selector}": ${e.message}`);
  });

  stdout(`Found ${title} in browser page`);

  let content;

  if (allMatches) {
    content = await page.$$eval(
      selector,
      (elements, contentType) => elements.map((element) => element?.[contentType]?.trim()).filter(Boolean) as string[],
      contentType
    );
  } else {
    content = await page.$eval(selector, (element, contentType) => element?.[contentType]?.trim() ?? '', contentType);
  }

  return { name, content, contentType, allMatches, delim };
}

export async function launchBrowser(): Promise<void> {
  if (browserPromise) return;
  stdout('Launching browser');
  browserPromise = puppeteer
    .launch()
    .then((browser) => {
      stdout('Browser launched');
      return browser;
    })
    .catch((e) => {
      throw new Error(`Unable to launch browser: ${e.message}`);
    });
}

export const closeBrowser = async (): Promise<void> => browserPromise?.then((browser) => browser.close());
