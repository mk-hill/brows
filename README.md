# brows

[![npm version](https://img.shields.io/npm/v/brows.svg?style=flat-square)](https://www.npmjs.org/package/brows)
[![build status](https://img.shields.io/travis/mk-hill/brows/master.svg?style=flat-square)](https://travis-ci.org/mk-hill/brows)
[![dependencies](https://img.shields.io/david/mk-hill/brows.svg?style=flat-square)](https://david-dm.org/mk-hill/brows)
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://github.com/mk-hill/brows/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/mk-hill/brows/pulls)
[![language](https://img.shields.io/github/languages/top/mk-hill/brows.svg?style=flat-square)](https://github.com/mk-hill/brows)

An easy to use application for consuming text content from any website in the command line. Uses CSS selectors to retrieve content.

## Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
  - [Basic usage](#basic-usage)
  - [Saving targets](#saving-targets)
  - [Saving groups](#saving-groups)
  - [Importing and exporting](#importing-and-exporting)
  - [Other](#other)
- [Additional Details](#additional-details)

## Features

- Sensible defaults
- [Saves targets](#saving-targets) and [groups of targets](#saving-groups) for easy access
- Automatically uses a headless browser [if necessary](#additional-details)
- Retrieves content from [any number of saved targets](#saving-groups) at a time
- [Simple import/export](#importing-and-exporting) for quickly saving and transferring many targets
- Handles targets asynchronously
- Doesn't make more requests (or open more browser pages) than it [needs to](#additional-details)
- Conventional [environment variables](#additional-details) take care of proxy if needed

## Installation

```console
npm install -g brows
```

## Usage

brows can either be used with one URL followed by one selector, or any number of saved target names.

```console
brows [options] <url> <selector>
brows [options] <name> [<name> ...]
```

| Option               | Alias | Description                                                |
| -------------------- | ----- | ---------------------------------------------------------- |
| `--save <name>`      | `-s`  | Save target or group for future use with given name        |
| `--save-only <name>` |       | Save target or group and exit without retrieving content   |
| `--html`             | `-h`  | Retrieve outer HTML instead of text content                |
| `--all-matches`      | `-a`  | Target all matching elements instead of just the first one |
| `--delim`            | `-d`  | Set delimiter between results for -a, defaults to newline  |
| `--force-browser`    | `-f`  | Prevent request attempt and force browser launch           |
| `--list-saved`       | `-l`  | Print a list of all saved targets and groups               |
| `--import <source>`  | `-i`  | Import targets and groups from source file                 |
| `--export <target>`  | `-e`  | Export all saved targets and groups to target file         |
| `--ordered-print`    | `-o`  | Print results in the order their targets were passed       |
| `--verbose`          | `-v`  | Print information about about what is being done           |
| `--help`             |       | Print a detailed explanation of usage and options          |

## Examples

### Basic usage

By default, brows will retrieve the first matching HTML element's text content.

```console
$ brows info.cern.ch/hypertext/WWW/TheProject.html h1
World Wide Web
```

The `--html` option can be used to retrieve its outer HTML instead.

```console
$ brows -h info.cern.ch/hypertext/WWW/TheProject.html h1
<h1>World Wide Web</h1>
```

`--all-matches` will target all elements matching the selector instead of just the first one.

```console
$ brows -a todomvc.com/examples/react 'ul:first-of-type li'
Tutorial
Philosophy
Support
Flux architecture example
```

`--delim` can be used to specify a different delimiter than the default newline.

```console
$ brows -a -d ', ' todomvc.com/examples/react 'ul:first-of-type li'
Tutorial, Philosophy, Support, Flux architecture example
```

Options can be placed anywhere.

```console
$ brows info.cern.ch/hypertext/WWW/TheProject.html h1 -v
# ...
Found h1 in http://info.cern.ch/hypertext/WWW/TheProject.html response data
World Wide Web
```

### Saving targets

Targets can be saved with a given name using `---save` or `--save-only`. Content type preference is saved as well.

```console
$ brows --save-only listItems todomvc.com/examples/react 'ul:first-of-type li' -a -d ', '
$ brows -s titleHtml info.cern.ch/hypertext/WWW/TheProject.html h1 -h
<h1>World Wide Web</h1>
```

This name can then be used in future executions.

```console
$ brows listItems
Tutorial, Philosophy, Support, Flux architecture example
```

Multiple saved names can be used at a time.

```console
$ brows titleHtml listItems
titleHtml: <h1>World Wide Web</h1>
listItems: Tutorial, Philosophy, Support, Flux architecture example
```

### Saving groups

Multiple saved targets can also be grouped under a different name.

```console
$ brows 'google.com/search?q=weather' '#wob_ttm' --save-only temperature
$ brows 'google.com/search?q=weather' '#wob_pp' --save-only precipitation
$ brows temperature precipitation --save-only weather
$ brows weather
temperature: 23
precipitation: 15%
```

It's generally much faster to retrieve all desired content together rather than performing a separate run for each target.

Further grouping saved targets (and groups of targets) makes this easy to do for content you expect to retrieve frequently.

```console
$ brows --save-only latestKurzgesagt 'youtube.com/user/Kurzgesagt/videos?sort=dd' '#video-title'
$ brows --save-only availability amazon.com/How-Absurd-Scientific-Real-World-Problems/dp/0525537090 '#availability span'
$ brows --save-only allExamples weather availability latestKurzgesagt titleHtml listItems
```

Results are printed as they are retrieved [by default](#other).

```console
$ brows allExamples
titleHtml: <h1>World Wide Web</h1>
listItems: Tutorial, Philosophy, Support, Flux architecture example
temperature: 23
precipitation: 15%
latestKurzgesagt: Who Is Responsible For Climate Change? – Who Needs To Fix It?
availability: Temporarily out of stock.
```

### Importing and exporting

`--import` and `--export` use a relative or absolute path to a file.

```console
brows -i example.yaml
brows -e /absolute/path/to/example2.yml
```

The import/export format is based around creating, editing, and transferring any number of targets and groups as easily as possible:

- Uses easy to read and quick to type [YAML](https://yaml.org/start.html) format [by default](#additional-details).
- Targets are grouped under their URLs.
- Defaults don't need to be entered.
- If no other options are being entered, each target name can be directly mapped to its corresponding selector.
- As in the command line, `http://` is automatically prepended to the URL if it doesn't begin with `http://` or `https://`.
- Groups can be entered as arrays of target names in any valid YAML format.
- You don't need to specify whether a browser is needed except for [niche use cases](#other).

```yaml
Targets:
  example.com:
    myHeader: h1
    mySpan: div span.my-span
  example2.com:
    myAnchors:
      selector: a
      contentType: outerHTML
      allMatches: true
Groups:
  myGroup: [myHeader, mySpan]
  anotherGroup: [mySpan, myAnchors]
```

is effectively the same as:

```yaml
Targets:
  http://example.com:
    myHeader:
      selector: h1
      contentType: textContent
      forceBrowser: false
      allMatches: false
    mySpan:
      selector: div span.my-span
      contentType: textContent
      forceBrowser: false
      allMatches: false
  http://example2.com:
    myAnchors:
      selector: a
      contentType: outerHTML
      forceBrowser: false
      allMatches: true
      delim: "\n"
Groups:
  myGroup:
    - myHeader
    - mySpan
  anotherGroup:
    - mySpan
    - myAnchors
```

Targets and groups saved in the above examples are exported as:

```yaml
Targets:
  amazon.com/How-Absurd-Scientific-Real-World-Problems/dp/0525537090:
    availability:
      forceBrowser: true
      selector: '#availability span'
  google.com/search?q=weather:
    precipitation:
      forceBrowser: true
      selector: '#wob_pp'
    temperature:
      forceBrowser: true
      selector: '#wob_ttm'
  info.cern.ch/hypertext/WWW/TheProject.html:
    titleHtml:
      contentType: outerHTML
      selector: h1
  todomvc.com/examples/react:
    listItems:
      allMatches: true
      delim: ', '
      forceBrowser: true
      selector: ul:first-of-type li
  youtube.com/user/Kurzgesagt/videos?sort=dd:
    latestKurzgesagt:
      forceBrowser: true
      selector: '#video-title'
Groups:
  allExamples:
    - temperature
    - precipitation
    - availability
    - latestKurzgesagt
    - titleHtml
    - listItems
  weather:
    - temperature
    - precipitation
```

### Other

The `--ordered-print` option can be used to wait for every target's content to be ready and print all of them together in the order they were passed instead of printing each result as it's retrieved.

```console
$ brows allExamples -o
temperature: 23
precipitation: 15%
availability: Temporarily out of stock.
latestKurzgesagt: Who Is Responsible For Climate Change? – Who Needs To Fix It?
titleHtml: <h1>World Wide Web</h1>
listItems: Tutorial, Philosophy, Support, Flux architecture example
```

Browser requirements are [handled automatically](#additional-details) for the vast majority of use cases. The `--force-browser` option will override defaults if needed.

```console
$ brows my-single-page-app.com html -h --force-browser > spa.html
```

## Additional Details

- By default, brows will initially make a GET request to the URL and attempt to find the selector in the response HTML. If this fails, a headless browser will be used instead.
- If a saved target isn't found in the response data on the first attempt, it will be automatically updated to skip the unnecessary request in the future and directly launch the browser.
- When multiple saved names are passed, brows will only make a request
  (and/or navigate a browser page) to each URL once.
  All targets in the same URL will be retrieved from the same response
  data and/or browser page.
- Saving multiple targets with a new name will create a group. Groups are essentially
  just aliases which expand to their member targets in the order they were passed when saving.
- When saving or retrieving content from multiple overlapping groups, each individual target is
  only used once. No duplicates will be retrieved or saved under the new combined group.
- Conventional `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` environment variables
  will be used if they exist.
- Importing [JSON](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON) files with the same structure as the YAML examples above is also supported without any additional configuration. Just pass a JSON file instead.
