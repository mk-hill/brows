# brows &middot; [![npm version](https://img.shields.io/npm/v/brows.svg?style=flat-square)](https://www.npmjs.org/package/brows) [![build status](https://img.shields.io/travis/mk-hill/brows/master.svg?style=flat-square)](https://travis-ci.org/mk-hill/brows) [![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://github.com/mk-hill/brows/blob/master/LICENSE) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)

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
  --save-only <name>    Save target and exit without retrieving content
  -l, --list-saved      List saved targets in alphabetical order
                        can be used without input to only list and exit
  -h, --html            Retrieve outer HTML instead of text content
                        content type will be saved if save option is used
  -f, --force-browser   Prevent GET request and force browser launch
                        will be updated automatically on saved targets if
                        initial attempt fails, can also be saved manually
  -o, --ordered         Wait for all content and print results in the
                        order they were passed. groups will expand to
                        their members in the order they were saved
  -v, --verbose         Print additional details about what is being done
  --help                Display this message

By default, brows will initially make a GET request to the URL and
attempt to find the selector in the response HTML. If this fails,
a headless browser will be used instead.

When multiple saved names are passed, brows will only make a request
(and/or navigate a browser page) to each URL once.
All targets in the same URL will be retrieved from the same response
data and/or browser page.

Conventional HTTP_PROXY/HTTPS_PROXY/NO_PROXY environment variables
will be used if they exist.
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
canIBuyItYet: Temporarily out of stock.
latestKurzgesagt: Could Solar Storms Destroy Civilization? Solar Flares & Coronal Mass Ejections
titleHtml: <h1>World Wide Web</h1>
```

By default, brows will only resort to launching a headless browser if it can't find the given selector in the HTML content it receives in the response. This can be overridden using the `--force-browser` option.

```console
$ brows my-single-page-app.com html -h --force-browser > spa.html
```
