# brows [![Build Status](https://travis-ci.com/mk-hill/brows.svg?branch=master)](https://travis-ci.com/mk-hill/brows) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)

An easy to use application for consuming text content from any website in the command line. Uses CSS selectors to retrieve content.

## Installation

```console
$ npm install -g brows
```

## Usage

```console
$ brows --help

Retrieve content from the first HTML element matching CSS selector in URL

Usage
  $ brows [options] <url> <selector>
  $ brows [options] <name> [<name> ...]

Options
  -s, --save <name>     Save target for future use with given name
                        multiple saved names can be used at a time,
                        and grouped under a different name
  --save-only <name>    Save input and exit without retrieving content
  -l, --list-saved      List saved targets in alphabetical order
                        can be used without input to only list and exit
  -h, --html            Retrieve outer HTML instead of text content
                        content type will be saved if save option is used
  -f, --force-browser   Prevent fetch attempt and force browser launch
                        will be updated automatically on saved options if
                        fetch attempt fails, can also be saved manually
  -v, --verbose         Print additional details about what is being done
                        not saved, determined separately for each run

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
$ brows -h info.cern.ch/hypertext/WWW/TheProject.html h1
<h1>World Wide Web</h1>
```

Targets can be saved with a given name using `---save` or `--save-only`.

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
Fetching http://info.cern.ch/hypertext/WWW/TheProject.html content
Fetched http://info.cern.ch/hypertext/WWW/TheProject.html content
Found titleHtml in fetched content
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

Multiple saved targets can also be grouped under a different name.

```console
$ brows temperature precipitation humidity --save-only weather
$ brows weather
temperature: 27
precipitation: 15%
humidity: 58%
```

`--list-saved` will display the details of all saved targets in alphabetical order.

```console
$ brows -l
humidity:
  url: http://google.com/search?q=weather
  selector: #wob_hm
  contentType: textContent
  forceBrowser: true
latestKurzgesagt:
  url: http://youtube.com/user/Kurzgesagt/videos?sort=dd
  selector: #video-title
  contentType: textContent
  forceBrowser: true
precipitation:
  url: http://google.com/search?q=weather
  selector: #wob_pp
  contentType: textContent
  forceBrowser: true
temperature:
  url: http://google.com/search?q=weather
  selector: #wob_ttm
  contentType: textContent
  forceBrowser: true
titleHtml:
  url: http://info.cern.ch/hypertext/WWW/TheProject.html
  selector: h1
  contentType: outerHTML
  forceBrowser: false
weather:
  children: temperature,precipitation,humidity
```

By default, brows will only resort to launching a headless browser if it can't find the given selector in the HTML content it fetches. This can be overridden using the `--force-browser` option.

```console
$ brows my-single-page-app.com html -h --force-browser > spa.html
```
