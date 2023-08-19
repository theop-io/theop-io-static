# theop-io-static

[![GitHub Build Status](https://github.com/theop-io/theop-io-static/actions/workflows/node.js.yml/badge.svg)](https://github.com/theop-io/theop-io-static/actions/workflows/node.js.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/2f89d3b3-8a11-475a-a87d-e59647a42e42/deploy-status)](https://app.netlify.com/sites/theop-io-static/deploys)

Static assets for https://theop.io

# Using our tweaks from Squarespace

## Simple tweaks

### Removing underlines from links

In the Squarespace editor, change the formatting of any link to _Strikethrough_ (Shift-Command-X) and our site tweak will get it to display without an underline:

![Applying Strikethrough formatting in the Squarespace editor](docs/site-tweak-no-link-underline.png)

_Engineering note_: This is effected through [site-tweaks CSS](src/site-tweaks/site-tweaks.scss) hacking `line-through`.

# Engineering notes

## Setup

- `npm install`

## Building

- `npm build`
- `npm serve` -> serves on port 5055
- `npm format:fix`

## Index of tweaks and features

- [Site tweaks](src/site-tweaks/README.md)
- [The Library](src/the-library/README.md)
- [The Words](src/the-words/README.md)
