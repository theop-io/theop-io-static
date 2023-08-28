# Site-level tweaks (a.k.a. Messing with SquareSpace)

## Links with no underlines

To remove the underline of any link, use the SquareSpace editor to decorate the link with a strike-through (the ~~T~~ button on the right of the styling popup).

This should only affect links; regular text can still receive _actual_ strike-through effects.

### How it's done

We're optimizing for the authoring experience in SquareSpace, i.e. allowing folks to use the regular text editor to compose text and UI elements
without having to resort to Markdown or HTML.

SquareSpace lets us mark text as strike-through and we can redefine the strike-through styling to instead apply a no-underline style to links.
This is a bit fragile but faster (in the sense of runtime performance) than the alternative outlined (and implemented) below.

### Alternatives considered: JavaScript+link-fragment-based hack

The only tool we have for identifying links programmatically is the link target itself (much like for [The Words](../the-words/README.md)).

To mark a link to (e.g.) `https://http.cat` to not have an underline applied to it from the default SquareSpace styling,
append `#no_ul` to the link target, e.g. `https://http.cat#no_ul`.

This tweak evaluates all links on every page, searches for (and removes) the `#no_ul` suffix, and attaches the `.no_underline` class to the given link.

**Note that this tweak has been moved to the [retired](retired/index.html) section because it presumably has worse performance than the simple CSS-based tweak.**

## "Become a member!" button quotes

These buttons are regular links; just add a `#member_signup` suffix to the link target and we'll replace the button content with a random quote
from [member-signup-button-quotes.ts](member-signup-button-quotes).

### How it's done

The only tool we have for identifying links programmatically is the link target itself (much like for [The Words](../the-words/README.md)).

This tweak evaluates all links on every page, searches for (and removes) the `#member_signup` suffix,
and replaces the link's content with a quote from [member-signup-button-quotes.ts](member-signup-button-quotes).

## Sundry engineering notes

- to color text site-standard red, use `var(--paragraphLinkColor)`.
