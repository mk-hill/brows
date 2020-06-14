import { brows } from '../src';
import { readOptions } from '../src/options';
import { options, results } from './setup';

test('Throws with no input', () => expect(brows(options.noInput)).rejects.toThrow());

test('Throws with no selector', () => expect(brows(options.noSelector)).rejects.toThrow());

test('Fetches text content', () => expect(brows(options.fetchText)).resolves.toBe(results.fetchText));

test('Retrieves text content from SPA', () => expect(brows(options.spaText)).resolves.toBe(results.spaText));

test('Fetches outer HTML', () => expect(brows(options.fetchHtml)).resolves.toMatch(results.fetchHtml));

test('Retrieves outer HTML from SPA', () => expect(brows(options.spaHtml)).resolves.toMatch(results.spaHtml));

test('Retrieves content from unformatted URL', () => expect(brows(options.formatUrl)).resolves.toBe(results.fetchText));

test('Saves fetch text content options', () =>
  brows(options.saveFetch).then(() =>
    expect(readOptions(options.saveFetch.flags.save)).resolves.toMatchObject({
      url: options.saveFetch.input[0],
      selector: options.saveFetch.input[1],
      contentType: 'textContent',
    })
  ));

test('Fetches text content from saved options', () => expect(brows(options.savedFetch)).resolves.toBe(results.fetchText));

test('Saves fetch HTML options', () =>
  brows(options.saveFetchHtml).then(() =>
    expect(readOptions(options.saveFetchHtml.flags.save)).resolves.toMatchObject({
      url: options.saveFetchHtml.input[0],
      selector: options.saveFetchHtml.input[1],
      contentType: 'outerHTML',
    })
  ));

test('Fetches outer HTML from saved options', () => expect(brows(options.savedFetchHtml)).resolves.toMatch(results.fetchHtml));

test('Updates saved SPA options to skip fetch attempt', () =>
  brows(options.saveSpa).then(() =>
    expect(readOptions(options.saveSpa.flags.save)).resolves.toMatchObject({
      url: options.saveSpa.input[0],
      selector: options.saveSpa.input[1],
      contentType: 'textContent',
      forceBrowser: true,
    })
  ));

test('Retrieves content from saved SPA options', () => expect(brows(options.savedSpa)).resolves.toBe(results.spaText));

test('Retrieves contents from multiple saved options', () =>
  expect(brows(options.multipleSaved)).resolves.toMatch(new RegExp(`.*?(${results.fetchText}|${results.spaText})`)));
