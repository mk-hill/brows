# brows [![Build Status](https://travis-ci.com/mk-hill/brows.svg?branch=master)](https://travis-ci.com/mk-hill/brows) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)

An easy to use application for viewing text content from any website in the command line. Uses CSS selectors to retrieve content.

## Installation

```console
$ npm install -g brows
```

## Usage

```console
$ brows --help

Retrieve contents of the first HTML element matching a CSS selector in a URL

Usage
  $ brows <url> <selector>
  $ brows <url> <selector> -s <name>
  $ brows <name>
  $ brows <name> <name> ...

Options
  -s, --save <name>     Save input for future use with given name
                        multiple saved names can be used at a time
  -l, --list-saved      List saved options
  -v, --verbose         Print additional details about what is being done
                        not saved, determined separately for each run
  -h, --html            Return element's outer HTML instead of its text content
                        content type will be saved if save option is used
  -f, --force-browser   Prevent initial fetch attempt and force browser launch
                        will be updated automatically on saved options if
                        fetch attempt fails, can also be saved manually
  --save-only <name>    Save input and exit without retrieving content

By default, will initially attempt to retrieve content from fetched HTML
If this fails, a headless browser will be used instead

Previously fetched URL contents and launched browser pages will be
reused if multiple saved names which target the same URL are passed
```

## Examples

By default, brows will retrieve the matching element's text content.

```console
$ brows info.cern.ch/hypertext/WWW/TheProject.html h1
World Wide Web
```

The `--html` option can be used to retrieve its outer HTML instead.

```console
$ brows info.cern.ch/hypertext/WWW/TheProject.html h1 -h
<h1>World Wide Web</h1>
```

Input can be saved with a given name using `---save` or `--save-only`.

```console
$ brows 'youtube.com/user/Kurzgesagt/videos?sort=dd' '#video-title' --save-only latestKurzgesagt
$ brows info.cern.ch/hypertext/WWW/TheProject.html h1 -h -s titleHtml
<h1>World Wide Web</h1>
```

This name can then be used in future executions.

```console
$ brows latestKurzgesagt
Could Solar Storms Destroy Civilization? Solar Flares & Coronal Mass Ejections
$ brows titleHtml
<h1>World Wide Web</h1>
```

Multiple saved names can be used at a time.

```console
$ brows 'google.com/search?q=weather' '#wob_ttm' --save-only temperature
$ brows 'google.com/search?q=weather' '#wob_pp' --save-only precipitation
$ brows 'google.com/search?q=weather' '#wob_hm' --save-only humidity
$ brows temperature precipitation humidity
temperature: 34
precipitation: 0%
humidity: 29%
```

By default, brows will only resort to launching a headless browser if it can't find the given selector in the HTML content it fetches. This can be overridden using the `--force-browser` option.

```console
$ brows my-single-page-app.com html -h --force-browser > spa.html
```
