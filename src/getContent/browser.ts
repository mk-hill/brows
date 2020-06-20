import puppeteer, { Browser, Page } from 'puppeteer';
import { TimeoutError } from 'puppeteer/Errors';

import { Target } from '../targets';
import { highlight, printIf } from '../util';
import { ElementNotFoundError } from './ElementNotFoundError';
import { RunOptions } from '../options';

let browserPromise: Promise<Browser>;
const pages: Record<string, Promise<Page>> = {};

export async function getContentFromBrowser(target: Readonly<Target>, { verbose }: Readonly<RunOptions>): Promise<string> {
  const { url, selector, contentType, name } = target;

  const { stdout } = printIf(verbose);

  if (!browserPromise) launchBrowser(verbose);

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
