import brows from '../src';
import { readTarget, ContentType } from '../src/targets';
import { urls, selectors, results, names } from './setup';

const { h1 } = selectors;

describe('Invalid input', () => {
  test('Throws with no input', () => expect(brows()).rejects.toThrow());

  test('Throws with url or selector missing', () => expect(brows(urls.fetch)).rejects.toThrow());
});

describe('Anonymous targets', () => {
  test('Fetches text content', () => expect(brows(urls.fetch, h1)).resolves.toMatchObject({ [names.default]: results.fetchText }));

  test('Retrieves text content from SPA', () =>
    expect(brows(urls.spa, h1)).resolves.toMatchObject({ [names.default]: results.spaText }));

  test('Fetches outer HTML', () =>
    expect(brows(urls.fetch, h1, { html: true })).resolves.toMatchObject({ [names.default]: results.fetchHtml }));

  test('Retrieves outer HTML from SPA', () =>
    expect(brows(urls.spa, h1, { html: true })).resolves.toMatchObject({ [names.default]: results.spaHtml }));

  test('Retrieves content from unformatted URL', () =>
    expect(brows(urls.unformatted, h1)).resolves.toMatchObject({ [names.default]: results.fetchText }));
});

describe('Named targets', () => {
  beforeAll(async () => {
    await Promise.all([
      brows(urls.fetch, h1, { saveOnly: names.fetchText }),
      brows(urls.fetch, h1, { html: true, saveOnly: names.fetchHtml }),
      brows(urls.spa, h1, { save: names.spaText }),
      brows(urls.spa, h1, { html: true, save: names.spaHtml }),
    ]);
  });

  test('Saves fetch text content target', () =>
    expect(readTarget(names.fetchText)).resolves.toMatchObject({
      url: urls.fetch,
      selector: h1,
      contentType: ContentType.TEXT_CONTENT,
    }));

  test('Fetches text content from saved target', () =>
    expect(brows(names.fetchText)).resolves.toMatchObject({ [names.fetchText]: results.fetchText }));

  test('Saves fetch outer HTML target', () =>
    expect(readTarget(names.fetchHtml)).resolves.toMatchObject({
      url: urls.fetch,
      selector: h1,
      contentType: ContentType.OUTER_HTML,
    }));

  test('Fetches outer HTML from saved target', () =>
    expect(brows(names.fetchHtml)).resolves.toMatchObject({ [names.fetchHtml]: results.fetchHtml }));

  test('Updates saved SPA text content target to skip fetch attempt', () =>
    expect(readTarget(names.spaText)).resolves.toMatchObject({
      url: urls.spa,
      selector: h1,
      forceBrowser: true,
      contentType: ContentType.TEXT_CONTENT,
    }));

  test('Retrieves text content from saved SPA target', () =>
    expect(brows(names.spaText)).resolves.toMatchObject({ [names.spaText]: results.spaText }));

  test('Updates saved SPA outer HTML target to skip fetch attempt', () =>
    expect(readTarget(names.spaHtml)).resolves.toMatchObject({
      url: urls.spa,
      selector: h1,
      contentType: ContentType.OUTER_HTML,
      forceBrowser: true,
    }));

  test('Retrieves outer HTML from saved SPA target', () =>
    expect(brows(names.spaHtml)).resolves.toMatchObject({ [names.spaHtml]: results.spaHtml }));

  test('Retrieves contents from multiple saved targets', () =>
    expect(brows(names.fetchText, names.fetchHtml, names.spaText, names.spaHtml)).resolves.toMatchObject({
      [names.fetchText]: results.fetchText,
      [names.fetchHtml]: results.fetchHtml,
      [names.spaText]: results.spaText,
      [names.spaHtml]: results.spaHtml,
    }));

  describe('Groups', () => {
    beforeAll(async () => {
      await Promise.all([
        brows(names.fetchText, names.spaText, { saveOnly: names.textGroup }),
        brows(names.fetchHtml, names.spaHtml, { saveOnly: names.htmlGroup }),
        brows(names.fetchText, names.fetchHtml, { saveOnly: names.fetchGroup }),
      ]);
      await Promise.all([
        brows(names.textGroup, names.htmlGroup, { saveOnly: names.combinedGroups }),
        brows(names.textGroup, names.htmlGroup, names.fetchGroup, { saveOnly: names.overlappingGroups }),
      ]);
    });

    test('Saves multiple text content targets under one group', () =>
      expect(readTarget(names.textGroup)).resolves.toMatchObject({
        members: [names.fetchText, names.spaText],
      }));

    test('Retrieves multiple text contents from single group', () =>
      expect(brows(names.textGroup)).resolves.toMatchObject({
        [names.fetchText]: results.fetchText,
        [names.spaText]: results.spaText,
      }));

    test('Saves multiple outer html targets under one group', () =>
      expect(readTarget(names.htmlGroup)).resolves.toMatchObject({
        members: [names.fetchHtml, names.spaHtml],
      }));

    test('Retrieves multiple outer html results from single saved group', () =>
      expect(brows(names.htmlGroup)).resolves.toMatchObject({
        [names.fetchHtml]: results.fetchHtml,
        [names.spaHtml]: results.spaHtml,
      }));

    test('Saves different content types under one group', () =>
      expect(readTarget(names.fetchGroup)).resolves.toMatchObject({
        members: [names.fetchText, names.fetchHtml],
      }));

    test('Retrieves different content types from single saved group', () =>
      expect(brows(names.fetchGroup)).resolves.toMatchObject({
        [names.fetchText]: results.fetchText,
        [names.fetchHtml]: results.fetchHtml,
      }));

    test('Saves combined groups under new group', () =>
      expect(readTarget(names.combinedGroups)).resolves.toMatchObject({
        members: [names.fetchText, names.spaText, names.fetchHtml, names.spaHtml],
      }));

    test('Retrieves all content from saved combined group', () =>
      expect(brows(names.combinedGroups)).resolves.toMatchObject({
        [names.fetchText]: results.fetchText,
        [names.fetchHtml]: results.fetchHtml,
        [names.spaText]: results.spaText,
        [names.spaHtml]: results.spaHtml,
      }));

    test('Does not save duplicates when saving overlapping groups', () =>
      expect(readTarget(names.overlappingGroups)).resolves.toMatchObject({
        members: [names.fetchText, names.spaText, names.fetchHtml, names.spaHtml],
      }));
  });
});
