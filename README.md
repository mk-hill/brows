# brows &middot; [![npm version](https://img.shields.io/npm/v/brows.svg?style=flat-square)](https://www.npmjs.org/package/brows) [![build status](https://img.shields.io/travis/mk-hill/brows/master.svg?style=flat-square)](https://travis-ci.org/mk-hill/brows) [![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://github.com/mk-hill/brows/blob/master/LICENSE) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)

An easy to use application for consuming text content from any website in the command line. Uses CSS selectors to retrieve content.

## Contents

- [Contents](#contents)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
  - [Basic usage](#basic-usage)
  - [Saving targets](#saving-targets)
  - [Saving groups](#saving-groups)
  - [Other](#other)
- [Additional Details](#additional-details)

## Features

- [Saves targets](#saving-targets) and [groups of targets](#saving-groups) for easy access
- Automatically uses a [headless browser](#additional-details) if necessary
- Retrieves content from [any number of saved targets](#saving-groups) at a time
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

| Option               | Alias | Description                                              |
| -------------------- | ----- | -------------------------------------------------------- |
| `--save <name>`      | `-s`  | Save target or group for future use with given name      |
| `--save-only <name>` |       | Save target or group and exit without retrieving content |
| `--list-saved`       | `-l`  | List saved targets and groups in alphabetical order      |
| `--html`             | `-h`  | Retrieve outer HTML instead of text content              |
| `--force-browser`    | `-f`  | Prevent request attempt and force browser launch         |
| `--ordered`          | `-o`  | Print results in the order their targets were passed     |
| `--verbose`          | `-v`  | Print information about about what is being done         |
| `--help`             |       | Print a detailed explanation of usage and options        |

## Examples

### Basic usage

By default, brows will retrieve the matching element's text content.

```console
$ brows info.cern.ch/hypertext/WWW/TheProject.html h1
World Wide Web
```

The `--html` option can be used to retrieve its outer HTML instead.

```console
$ brows -h info.cern.ch/hypertext/WWW/TheProject.html h1
<h1>World Wide Web</h1>
```

### Saving targets

Targets can be saved with a given name using `---save` or `--save-only`. Content preferences are saved as well.

```console
$ brows --save-only latestKurzgesagt 'youtube.com/user/Kurzgesagt/videos?sort=dd' '#video-title'
$ brows -s titleHtml -h info.cern.ch/hypertext/WWW/TheProject.html h1
<h1>World Wide Web</h1>
```

This name can then be used in future executions.

```console
$ brows latestKurzgesagt
Could Solar Storms Destroy Civilization? Solar Flares & Coronal Mass Ejections
```

Options can be placed anywhere.

```console
$ brows titleHtml -v
Loading saved target: titleHtml
Loaded saved target: titleHtml
Requesting http://info.cern.ch/hypertext/WWW/TheProject.html content for titleHtml
Received response from http://info.cern.ch/hypertext/WWW/TheProject.html
Found titleHtml in response data
<h1>World Wide Web</h1>
```

Multiple saved names can be used at a time.

```console
$ brows 'google.com/search?q=weather' '#wob_ttm' --save-only temperature
$ brows 'google.com/search?q=weather' '#wob_pp' --save-only precipitation
$ brows 'google.com/search?q=weather' '#wob_hm' --save-only humidity
$ brows temperature precipitation humidity
temperature: 27
precipitation: 15%
humidity: 58%
```

### Saving groups

Multiple saved targets can also be grouped under a different name.

```console
$ brows temperature precipitation humidity --save-only weather
$ brows weather
temperature: 27
precipitation: 15%
humidity: 58%
```

It's generally much faster to retrieve all desired content together rather than performing a separate run for each target.

Further grouping saved targets (and groups of targets) makes this easy to do for content you expect to retrieve frequently.

```console
$ brows --save-only lastBuild travis-ci.com/github/mk-hill/brows/builds '.row-li [href*="builds"] .label-align'
$ brows --save-only openIssues github.com/mk-hill/brows 'a[href*="issues"] .Counter'
$ brows --save-only status lastBuild openIssues
$ brows --save-only availability amazon.com/How-Absurd-Scientific-Real-World-Problems/dp/0525537090 '#availability span'
$ brows --save-only all weather status availability latestKurzgesagt titleHtml
```

Results are printed as they are retrieved by default.

```console
$ brows all
titleHtml: <h1>World Wide Web</h1>
openIssues: 0
lastBuild: #16 passed
temperature: 27
precipitation: 15%
humidity: 58%
latestKurzgesagt: Could Solar Storms Destroy Civilization? Solar Flares & Coronal Mass Ejections
availability: Temporarily out of stock.
```

The `--ordered` option can be used to wait for every target's content to be retrieved and print all of them together in the order they were passed instead.

```console
$ brows all -o
temperature: 27
precipitation: 15%
humidity: 58%
lastBuild: #16 passed
openIssues: 0
availability: Temporarily out of stock.
latestKurzgesagt: Could Solar Storms Destroy Civilization? Solar Flares & Coronal Mass Ejections
titleHtml: <h1>World Wide Web</h1>
```

### Other

By default, brows will only resort to launching a headless browser if it can't find the given selector in the HTML content it receives in the response. This can be overridden using the `--force-browser` option.

```console
$ brows my-single-page-app.com html -h --force-browser > spa.html
```

## Additional Details

By default, brows will initially make a GET request to the URL and attempt to find the selector in the response HTML. If this fails, a headless browser will be used instead.

If a saved target isn't found in the response data on the first attempt, it will be automatically updated to skip the unnecessary request in the future and directly launch the browser.

When multiple saved names are passed, brows will only make a request
(and/or navigate a browser page) to each URL once.
All targets in the same URL will be retrieved from the same response
data and/or browser page.

Conventional `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` environment variables
will be used if they exist.
