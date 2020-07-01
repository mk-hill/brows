import { existsSync } from 'fs';
import { resolve } from 'path';

import brows from '../src';
import { readTarget, ContentType } from '../src/targets';

import { urls, selectors, results, names, paths } from './setup';

const { h1, dt, itemsInFirstList } = selectors;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

describe('Invalid input', () => {
  test('Throws with no input', () => expect(brows()).rejects.toThrow());

  test('Throws with url or selector missing', () => expect(brows(urls.fetch)).rejects.toThrow());
});

describe('Anonymous targets', () => {
  test('Fetches text content', () => expect(brows(urls.fetch, h1)).resolves.toMatchObject({ [names.default]: results.fetchText }));

  test('Fetches outer HTML', () =>
    expect(brows(urls.fetch, h1, { html: true })).resolves.toMatchObject({ [names.default]: results.fetchHtml }));

  test('Fetches text content from all matching elements', () =>
    expect(brows(urls.fetch, dt, { allMatches: true })).resolves.toMatchObject({ [names.default]: results.fetchAllText }));

  test('Fetches outer HTML from all matching elements', () =>
    expect(brows(urls.fetch, dt, { allMatches: true, html: true })).resolves.toMatchObject({
      [names.default]: results.fetchAllHtml,
    }));

  test("Doesn't launch browser unless necessary", () =>
    brows(urls.fetch, h1, { verbose: true, suppressAllOutput: false }).then(() =>
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Using browser'))
    ));

  test('Retrieves text content from SPA', () =>
    expect(brows(urls.spa, h1)).resolves.toMatchObject({ [names.default]: results.spaText }));

  test('Retrieves outer HTML from SPA', () =>
    expect(brows(urls.spa, h1, { html: true })).resolves.toMatchObject({ [names.default]: results.spaHtml }));

  test('Retrieves text content from all matches in SPA', () =>
    expect(brows(urls.spa, itemsInFirstList, { allMatches: true })).resolves.toMatchObject({
      [names.default]: results.spaAllText,
    }));

  test('Retrieves outer HTML from all matches in SPA', () =>
    expect(brows(urls.spa, itemsInFirstList, { allMatches: true, html: true })).resolves.toMatchObject({
      [names.default]: results.spaAllHtml,
    }));

  test('Automatically launches browser if necessary', () =>
    brows(urls.spa, h1, { verbose: true, suppressAllOutput: false }).then(() =>
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Using browser'))
    ));

  test('Retrieves content from unformatted URL', () =>
    expect(brows(urls.unformatted, h1)).resolves.toMatchObject({ [names.default]: results.fetchText }));
});

describe('Named targets', () => {
  beforeAll(async () => {
    await Promise.all([
      brows(urls.fetch, h1, { saveOnly: names.fetchText }),
      brows(urls.fetch, h1, { html: true, saveOnly: names.fetchHtml }),
      brows(urls.fetch, dt, { allMatches: true, saveOnly: names.fetchAllText }),
      brows(urls.fetch, dt, { allMatches: true, html: true, saveOnly: names.fetchAllHtml }),
      brows(urls.spa, h1, { save: names.spaText }),
      brows(urls.spa, h1, { html: true, save: names.spaHtml }),
      brows(urls.spa, itemsInFirstList, { allMatches: true, saveOnly: names.spaAllText }),
      brows(urls.spa, itemsInFirstList, { allMatches: true, html: true, saveOnly: names.spaAllHtml }),
    ]);
  });

  test('Warns if input includes both saved names and unknown strings', () => {
    brows(names.fetchText, names.fetchHtml, 'nonsense', 'moreNonsense', { suppressAllOutput: false }).then(() =>
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching('Use either one URL followed by one CSS selector or only saved target names')
      )
    );
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

  test('Saves fetch text content from all matches target', () =>
    expect(readTarget(names.fetchAllText)).resolves.toMatchObject({
      url: urls.fetch,
      selector: dt,
      contentType: ContentType.TEXT_CONTENT,
      allMatches: true,
    }));

  test('Fetches text content from all matches using saved target', () =>
    expect(brows(names.fetchAllText)).resolves.toMatchObject({ [names.fetchAllText]: results.fetchAllText }));

  test('Saves fetch outer HTML from all matches target', () =>
    expect(readTarget(names.fetchAllHtml)).resolves.toMatchObject({
      url: urls.fetch,
      selector: dt,
      contentType: ContentType.OUTER_HTML,
      allMatches: true,
    }));

  test('Fetches outer HTML from all matches using saved target', () =>
    expect(brows(names.fetchAllHtml)).resolves.toMatchObject({ [names.fetchAllHtml]: results.fetchAllHtml }));

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

  test('Skips fetch attempt when using updated target', () =>
    brows(names.spaText, { verbose: true, suppressAllOutput: false }).then(() =>
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Skipping request attempt'))
    ));

  test('Retrieves outer HTML from saved SPA target', () =>
    expect(brows(names.spaHtml)).resolves.toMatchObject({ [names.spaHtml]: results.spaHtml }));

  test('Saves spa text content from all matches target', () =>
    expect(readTarget(names.spaAllText)).resolves.toMatchObject({
      url: urls.spa,
      selector: itemsInFirstList,
      contentType: ContentType.TEXT_CONTENT,
      allMatches: true,
    }));

  test('Retrieves text content from all matches in SPA using saved target', () =>
    expect(brows(names.spaAllText)).resolves.toMatchObject({ [names.spaAllText]: results.spaAllText }));

  test('Saves spa outer HTML from all matches target', () =>
    expect(readTarget(names.spaAllHtml)).resolves.toMatchObject({
      url: urls.spa,
      selector: itemsInFirstList,
      contentType: ContentType.OUTER_HTML,
      allMatches: true,
    }));

  test('Retrieves contents from all saved targets at once', () =>
    expect(
      brows(
        names.fetchText,
        names.fetchHtml,
        names.fetchAllText,
        names.fetchAllHtml,
        names.spaText,
        names.spaHtml,
        names.spaAllText,
        names.spaAllHtml
      )
    ).resolves.toMatchObject({
      [names.fetchText]: results.fetchText,
      [names.fetchHtml]: results.fetchHtml,
      [names.fetchAllText]: results.fetchAllText,
      [names.fetchAllHtml]: results.fetchAllHtml,
      [names.spaText]: results.spaText,
      [names.spaHtml]: results.spaHtml,
      [names.spaAllText]: results.spaAllText,
      [names.spaAllHtml]: results.spaAllHtml,
    }));
});

describe('Groups', () => {
  beforeAll(async () => {
    await Promise.all([
      brows(names.fetchText, names.spaText, { saveOnly: names.textGroup }),
      brows(names.fetchHtml, names.spaHtml, { saveOnly: names.htmlGroup }),
      brows(names.fetchText, names.fetchHtml, { saveOnly: names.fetchGroup }),
      brows(names.fetchAllText, names.spaAllText, { saveOnly: names.allTextGroup }),
      brows(names.fetchAllHtml, names.spaAllHtml, { saveOnly: names.allHtmlGroup }),
    ]);
    await Promise.all([
      brows(names.textGroup, names.allTextGroup, names.htmlGroup, names.allHtmlGroup, { saveOnly: names.combinedGroups }),
      brows(names.textGroup, names.htmlGroup, names.fetchGroup, { saveOnly: names.overlappingGroups }),
    ]);
  });

  test('Does not save duplicates when saving overlapping groups', () =>
    expect(readTarget(names.overlappingGroups)).resolves.toMatchObject({
      members: [names.fetchText, names.spaText, names.fetchHtml, names.spaHtml],
    }));

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

  test('Saves multiple (text content + all matches) targets under one group', () =>
    expect(readTarget(names.allTextGroup)).resolves.toMatchObject({
      members: [names.fetchAllText, names.spaAllText],
    }));

  test('Retrieves multiple (text content + all matches) targets from single group', () =>
    expect(brows(names.allTextGroup)).resolves.toMatchObject({
      [names.fetchAllText]: results.fetchAllText,
      [names.spaAllText]: results.spaAllText,
    }));

  test('Saves multiple (outer html + all matches) targets under one group', () =>
    expect(readTarget(names.allHtmlGroup)).resolves.toMatchObject({
      members: [names.fetchAllHtml, names.spaAllHtml],
    }));

  test('Retrieves multiple (outer html + all matches) targets from single group', () =>
    expect(brows(names.allHtmlGroup)).resolves.toMatchObject({
      [names.fetchAllHtml]: results.fetchAllHtml,
      [names.spaAllHtml]: results.spaAllHtml,
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

  test('Saves all groups under one combined group', () =>
    expect(readTarget(names.combinedGroups)).resolves.toMatchObject({
      members: [
        names.fetchText,
        names.spaText,
        names.fetchAllText,
        names.spaAllText,
        names.fetchHtml,
        names.spaHtml,
        names.fetchAllHtml,
        names.spaAllHtml,
      ],
    }));

  test('Retrieves all content from single combined group', () =>
    expect(brows(names.combinedGroups)).resolves.toMatchObject({
      [names.fetchText]: results.fetchText,
      [names.fetchHtml]: results.fetchHtml,
      [names.fetchAllText]: results.fetchAllText,
      [names.fetchAllHtml]: results.fetchAllHtml,
      [names.spaText]: results.spaText,
      [names.spaHtml]: results.spaHtml,
      [names.spaAllText]: results.spaAllText,
      [names.spaAllHtml]: results.spaAllHtml,
    }));
});

describe('Exports', () => {
  test('Exports to relative path', () =>
    brows({ export: paths.exportRelative }).then(() =>
      expect(existsSync(resolve(process.cwd(), paths.exportRelative))).toBe(true)
    ));

  test('Exports to absolute path', () =>
    brows({ export: paths.exportAbsolute }).then(() => expect(existsSync(paths.exportAbsolute)).toBe(true)));

  test('Exports to directory', () => brows({ export: '.' }).then(() => expect(existsSync(paths.default)).toBe(true)));
});

describe('Imports', () => {
  test('Imports from relative path', () =>
    brows({ import: paths.exportRelative }).then(() =>
      expect(brows(names.combinedGroups)).resolves.toMatchObject({
        [names.fetchText]: results.fetchText,
        [names.fetchHtml]: results.fetchHtml,
        [names.spaText]: results.spaText,
        [names.spaHtml]: results.spaHtml,
      })
    ));

  test('Imports from absolute path', () =>
    brows({ import: paths.exportAbsolute }).then(() =>
      expect(brows(names.combinedGroups)).resolves.toMatchObject({
        [names.fetchText]: results.fetchText,
        [names.fetchHtml]: results.fetchHtml,
        [names.spaText]: results.spaText,
        [names.spaHtml]: results.spaHtml,
      })
    ));

  test('Imports from directory', () =>
    brows({ import: paths.default }).then(() =>
      expect(brows(names.combinedGroups)).resolves.toMatchObject({
        [names.fetchText]: results.fetchText,
        [names.fetchHtml]: results.fetchHtml,
        [names.spaText]: results.spaText,
        [names.spaHtml]: results.spaHtml,
      })
    ));
});
