import puppeteer, { Browser, Page } from 'puppeteer';

import { error } from '../util';
import { Target } from '../targets';
import { stdout, Color, stderr } from '../stdio';

import { ElementNotFoundError } from './ElementNotFoundError';
import { GetContentResult } from '.';

const { TimeoutError } = puppeteer.errors;

let browserPromise: Promise<Browser>;
const pages: Record<string, Promise<Page>> = {};

export async function getContentFromBrowser(target: Readonly<Target>): Promise<GetContentResult> {
  const { name, url, selector, contentType, allMatches, delim } = target;

  if (!browserPromise) launchBrowser();

  const browser = await browserPromise;

  const title = name || selector;

  if (!pages[url]) {
    stdout.verbose`Opening browser page for ${title}: ${url}`;
    pages[url] = browser.newPage().then((page) =>
      page.goto(url).then(() => {
        stdout.verbose.success`Completed page navigation to: ${url}`;
        return page;
      })
    );
  } else {
    stdout.verbose.success`Using existing page for ${title}: ${url}`;
  }

  const page = await pages[url];

  stdout.verbose`Waiting for ${title} in browser page`;
  const warning = createWarning(target);

  await page.waitForSelector(selector).catch((e) => {
    if (e instanceof TimeoutError) {
      throw new ElementNotFoundError(url, selector);
    }
    throw error`Unable wait for selector ${selector}: 
                ${e.message}`;
  });

  clearTimeout(warning);
  stdout.verbose.success`Found ${title} in browser page`;

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

const warningMs = 5000;

/**
 * Only warn if verbose for saved targets
 */
function createWarning(target: Readonly<Target>): NodeJS.Timeout {
  const { name, url } = target;
  let warning;
  if (name) {
    const command = `brows -s '${name}' '${url}' <newSelector>`;
    warning = () => stderr.verbose`Still waiting for ${name}, page structure might have changed.
                                   You might want to exit and correct the saved selector using:
                                   ${[command, Color.BRIGHT]}
                                   Continuing to wait...`;
  } else {
    warning = () => stderr`Still waiting for target in browser page.
                           You might want to exit and confirm the url and selector are correct.
                           This warning will not be shown for saved targets unless using ${['--verbose', Color.BRIGHT]}.
                           Continuing to wait...`;
  }
  return setTimeout(warning, warningMs);
}

export async function launchBrowser(): Promise<void> {
  if (browserPromise) return;
  stdout.verbose`Launching browser`;
  browserPromise = puppeteer
    .launch()
    .then((browser) => {
      stdout.verbose.success`Browser launched`;
      return browser;
    })
    .catch((e) => {
      throw error`Unable to launch browser: ${e.message}`;
    });
}

export const closeBrowser = async (): Promise<void> => {
  if (!browserPromise) return;
  stdout.verbose`Closing browser`;
  return browserPromise.then((browser) => browser.close()).then(() => stdout.verbose.success`Browser closed`);
};
