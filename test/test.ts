import { brows } from '../src';
import { readOptions } from '../src/options';
import { options, results } from './setup';

describe('Invalid input', () => {
  test('Throws with no input', () => expect(brows(options.noInput)).rejects.toThrow());

  test('Throws with url or selector missing', () => expect(brows(options.noSelector)).rejects.toThrow());
});

describe('Unnamed options', () => {
  test('Fetches text content', () => expect(brows(options.fetchText)).resolves.toBe(results.fetchText));

  test('Retrieves text content from SPA', () => expect(brows(options.spaText)).resolves.toBe(results.spaText));

  test('Fetches outer HTML', () => expect(brows(options.fetchHtml)).resolves.toMatch(results.fetchHtml));

  test('Retrieves outer HTML from SPA', () => expect(brows(options.spaHtml)).resolves.toMatch(results.spaHtml));

  test('Retrieves content from unformatted URL', () => expect(brows(options.formatUrl)).resolves.toBe(results.fetchText));
});

describe('Saved options', () => {
  test('Saves fetch text content options', () =>
    brows(options.saveFetch).then(() =>
      expect(readOptions(options.saveFetch.flags.save)).resolves.toMatchObject({
        url: options.saveFetch.input[0],
        selector: options.saveFetch.input[1],
        contentType: 'textContent',
      })
    ));

  test('Fetches text content from saved options', () => expect(brows(options.savedFetch)).resolves.toBe(results.fetchText));

  test('Saves fetch outer HTML options', () =>
    brows(options.saveFetchHtml).then(() =>
      expect(readOptions(options.saveFetchHtml.flags.save)).resolves.toMatchObject({
        url: options.saveFetchHtml.input[0],
        selector: options.saveFetchHtml.input[1],
        contentType: 'outerHTML',
      })
    ));

  test('Fetches outer HTML from saved options', () => expect(brows(options.savedFetchHtml)).resolves.toMatch(results.fetchHtml));

  test('Updates saved SPA text content options to skip fetch attempt', () =>
    brows(options.saveSpa).then(() =>
      expect(readOptions(options.saveSpa.flags.save)).resolves.toMatchObject({
        url: options.saveSpa.input[0],
        selector: options.saveSpa.input[1],
        contentType: 'textContent',
        forceBrowser: true,
      })
    ));

  test('Retrieves text content from saved SPA options', () => expect(brows(options.savedSpa)).resolves.toBe(results.spaText));

  test('Updates saved SPA outer HTML options to skip fetch attempt', () =>
    brows(options.saveSpaHtml).then(() =>
      expect(readOptions(options.saveSpaHtml.flags.save)).resolves.toMatchObject({
        url: options.saveSpaHtml.input[0],
        selector: options.saveSpaHtml.input[1],
        contentType: 'outerHTML',
        forceBrowser: true,
      })
    ));

  test('Retrieves outer HTML from saved SPA options', () => expect(brows(options.savedSpaHtml)).resolves.toMatch(results.spaHtml));

  test('Retrieves contents from multiple saved options', () =>
    expect(brows(options.multipleSaved)).resolves.toMatch(results.allText));
});

describe('Parent Options', () => {
  test('Saves multiple text content options under one parent', () =>
    brows(options.saveParentText).then(() =>
      expect(readOptions(options.saveParentText.flags.saveOnly)).resolves.toMatchObject({
        children: options.saveParentText.input,
      })
    ));

  test('Retrieves multiple text contents from single parent', () =>
    expect(brows(options.savedParentText)).resolves.toMatch(results.allText));

  test('Saves multiple outer html options under one parent', () =>
    brows(options.saveParentHtml).then(() =>
      expect(readOptions(options.saveParentHtml.flags.saveOnly)).resolves.toMatchObject({
        children: options.saveParentHtml.input,
      })
    ));

  test('Retrieves multiple outer html results from single saved parent', () =>
    expect(brows(options.savedParentHtml)).resolves.toMatch(results.allText));

  test('Saves different content types under one parent', () =>
    brows(options.saveParentWww).then(() =>
      expect(readOptions(options.saveParentWww.flags.saveOnly)).resolves.toMatchObject({
        children: options.saveParentWww.input,
      })
    ));

  test('Retrieves different content types from single saved parent', () =>
    expect(brows(options.savedParentWww)).resolves.toMatch(new RegExp(`.*?(${results.fetchText}|${results.fetchText}</h1>)`)));

  test('Saves combined parents under new parent', () =>
    brows(options.saveCombinedParents).then(async () =>
      expect(readOptions(options.saveCombinedParents.flags.saveOnly)).resolves.toMatchObject({
        children: await Promise.all(
          options.saveCombinedParents.input.map((parentName) => readOptions(parentName).then(({ children }) => children))
        ).then((ar) => ar.flat()),
      })
    ));

  test('Retrieves all content from saved combined parent', () =>
    expect(brows(options.savedCombinedParents)).resolves.toMatch(results.allContent));

  test('Does not save duplicates when saving overlapping parents', () =>
    brows(options.saveOverlappingParents).then(async () =>
      expect(readOptions(options.saveOverlappingParents.flags.saveOnly)).resolves.toMatchObject({
        children: await Promise.all(
          options.saveCombinedParents.input.map((parentName) => readOptions(parentName).then(({ children }) => children))
        ).then((ar) => ar.flat()),
      })
    ));
});
