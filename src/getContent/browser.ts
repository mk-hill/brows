import puppeteer, { Browser, Page } from 'puppeteer';
import { TimeoutError } from 'puppeteer/Errors';

import { BrowsOptions } from '../options';
import { highlight, printIf } from '../util';
import { ElementNotFoundError } from './ElementNotFoundError';

let browserPromise: Promise<Browser>;
const pages: Record<string, Promise<Page>> = {};

export async function getContentsFromBrowser({ url, selector, contentType, verbose, name }: BrowsOptions): Promise<string> {
  const { stdout } = printIf(verbose);

  if (!browserPromise) launchBrowser(verbose);

  const browser = await browserPromise;

  if (!pages[url]) {
    stdout(`Opening ${highlight(url)} page in browser`);
    pages[url] = browser.newPage().then((page) =>
      page.goto(url).then(() => {
        stdout(`Page navigation to ${highlight(url)} complete`);
        return page;
      })
    );
  } else {
    stdout(`Using existing ${highlight(url)} page for ${highlight(name || selector)}`);
  }

  const page = await pages[url];

  await page.waitForSelector(selector).catch((e) => {
    if (e instanceof TimeoutError) {
      throw new ElementNotFoundError(url, selector);
    }
    throw new Error(`Unable wait for selector "${selector}": ${e.message}`);
  });

  stdout(name ? `Found ${highlight(name)} in browser` : `Found ${highlight(selector)} in ${highlight(url)} using browser`);

  return page.$eval(selector, (element, contentType) => element[contentType] ?? '', contentType);
}

export async function launchBrowser(verbose = false): Promise<void> {
  const { stdout } = printIf(verbose);
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
