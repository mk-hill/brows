# brows [![Build Status](https://travis-ci.com/mk-hill/brows.svg?branch=master)](https://travis-ci.com/mk-hill/brows) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)

An easy to use command line application for scraping any website using CSS selectors

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
    -v, --verbose         Print additional details about what is being done
                          not saved, determined separately for each run
    -h, --html            Return element's outer HTML instead of its text content
                          content type will be saved if save option is used
    -f, --force-browser   Prevent initial fetch attempt and force browser launch
                          will be updated automatically on saved options if
                          fetch attempt fails, can also be saved manually

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

The `--html` option can be used to retrieve it's outer HTML instead.

```console
$ brows info.cern.ch/hypertext/WWW/TheProject.html h1 -h
<h1>World Wide Web</h1>
```

Input can be saved with a given name using the `---save` option.

```console
$ brows 'youtube.com/user/Kurzgesagt/videos?sort=dd' '#video-title' -s latestKurzgesagt
Could Solar Storms Destroy Civilization? Solar Flares & Coronal Mass Ejections
```

This name can then be used in future executions.

```console
$ brows latestKurzgesagt
Could Solar Storms Destroy Civilization? Solar Flares & Coronal Mass Ejections
```

Multiple saved names can be used at a time.

```console
$ brows 'google.com/search?q=weather' '#wob_ttm' -s temperature
34
$ brows 'google.com/search?q=weather' '#wob_pp' -s precipitation
0%
$ brows 'google.com/search?q=weather' '#wob_hm' -s humidity
29%
$ brows temperature precipitation humidity
temperature: 34
precipitation: 0%
humidity: 29%
```

By default, brows will only resort to launching a headless browser if it can't find the given selector in the HTML content it fetches. This can be overridden using the `--force-browser` option.

```console
$ brows todomvc.com/examples/react html -h --force-browser > todomvc.html
```
