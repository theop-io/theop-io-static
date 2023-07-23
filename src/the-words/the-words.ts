import { computePosition, shift, offset, arrow } from "@floating-ui/dom";

import { wordKeyFromWord } from "./the-words-types";
import { theWordsDb } from "./generated/the-words-db";

//
// How to reference The Words (glossary) entries:
//
// <a href="#thewords_termFoo">Blah blah</a> -> finds the definition for theWords key `termFoo`; the anchor text (i.e. the reference) may be anything
// <a href="#thewords">word</a> -> finds the definition for theWords key `word`, i.e. the anchor body _is_ the key (case-insensitive, will convert spaces to underscores)
//

//
// Configuration
//

// TheWords configuration
const theWordsLinkPrefix = "#thewords"; // Used to identify theWords links when configuring the page
const theWordsKeyAttribute = "data-word-key"; // Used to find theWords key after page has been configured
const theWordsSearchResultAttribute = "data-search-result"; // Used to annotate word anchors during a search

const theWordsTooltip_OffsetFromParent = 5;

const theWordsTooltip_DelayBeforeClosing_msec = 500;

// State
// - Map of tooltips (starts empty, built out as we identify links requiring tooltips on the page)
//   NOTE: We inject tooltip <div>'s for each identified link so screen readers can follow them via `aria-labelledby="the-div's-id"`,
//         rather than instantiating a tooltip transiently on hover (though that would be more efficient).
const theWordsTooltips = new Map<string, HTMLDivElement>();

// - Latest search term
let theWordsCurrentSearchTerm = "";

type SearchResult = "match-by-term" | "match-by-definition" | "unmatched" | "none";

function setSearchResultForElement(element: HTMLElement, searchResult: SearchResult) {
  element.setAttribute(theWordsSearchResultAttribute, searchResult);
}

function getSearchResultForElement(element: HTMLElement): SearchResult {
  const attributeValue = element.getAttribute(theWordsSearchResultAttribute);
  return attributeValue ? (attributeValue as SearchResult) : "none";
}

// - Active tooltip
let theWordsActiveWordKey: string | undefined = undefined;
let theWordsHideTooltipTimer: number | undefined = undefined;

//
// Building tooltips
//

function updateTheWordsTooltipBody(wordKey: string, divElement: HTMLDivElement) {
  const displayName = theWordsDb.KeyToDisplayName.get(wordKey);

  if (!displayName) {
    return;
  }

  // Clear out any old content
  divElement.innerHTML = "";

  // Term

  const termElement = document.createElement("span");
  termElement.appendChild(document.createTextNode(`${displayName}:`));
  termElement.classList.add("tooltip_term");

  divElement.appendChild(termElement);

  // Definition
  const definitionText = theWordsDb.DisplayNameToDefinition.get(displayName) ?? "";

  if (!theWordsCurrentSearchTerm) {
    // Insert simple text
    divElement.appendChild(document.createTextNode(definitionText));
  } else {
    // Insert text with search term matches wrapped in <span>s
    const searchTermRegEx = new RegExp(`(${theWordsCurrentSearchTerm})`, "ig");

    divElement.insertAdjacentHTML(
      "beforeend",
      definitionText.replace(
        searchTermRegEx,
        "<span class='tooltip_definition_search_match'>$&</span>" // $& == insert matched text
      )
    );
  }

  // Create and append inner arrow <div>
  const arrowDivElement = document.createElement("div");
  arrowDivElement.classList.add("tooltip_arrow");
  divElement.appendChild(arrowDivElement);
}

function buildTheWordsTooltipElement(wordKey: string): HTMLDivElement {
  // Create <div>
  const divElement = document.createElement("div");

  // Configure <div>
  divElement.classList.add("tooltip_popup");
  divElement.role = "tooltip";
  divElement.id = `tooltip_popup_${wordKey}`.replace(/\//g, "_"); // Word keys may be multi-keys, i.e. have slashes -> fix that for our ID

  // Create and append content
  updateTheWordsTooltipBody(wordKey, divElement);

  // Add to document
  document.body.appendChild(divElement);

  return divElement;
}

//
// Listeners
//

function hideTooltipForWordKey(wordKey: string) {
  const tooltipElement = theWordsTooltips.get(wordKey);

  if (tooltipElement === undefined) {
    return;
  }

  // Hide tooltip
  tooltipElement.style.display = "";
}

function hideActiveWordTooltip() {
  if (theWordsActiveWordKey != undefined) {
    hideTooltipForWordKey(theWordsActiveWordKey);
    theWordsActiveWordKey = undefined;
  }
}

function cancelHideTooltipTimer() {
  if (theWordsHideTooltipTimer !== undefined) {
    window.clearTimeout(theWordsHideTooltipTimer);
    theWordsHideTooltipTimer = undefined;
  }
}

function showWordTooltip(event: Event) {
  const linkElement = event.target as HTMLLinkElement;

  // Check whether this link is eligible for tooltips
  const searchResult = getSearchResultForElement(linkElement);

  if (searchResult === "unmatched") {
    return;
  }

  // Get word key
  const wordKey = linkElement.getAttribute(theWordsKeyAttribute);

  if (wordKey === null) {
    return;
  }

  // Get tooltip element
  const tooltipElement = theWordsTooltips.get(wordKey);

  if (tooltipElement === undefined) {
    return;
  }

  // Cancel previously active timer, if any
  cancelHideTooltipTimer();

  // Close previously active tooltip, if any
  hideActiveWordTooltip();

  // Set up new tooltip
  // - Update content
  updateTheWordsTooltipBody(wordKey, tooltipElement);

  // - Build core middleware for FloatingUI
  const middleware = [
    offset(theWordsTooltip_OffsetFromParent), // Provide some spacing between button and tooltip
    shift(), // Automatically shift into view
  ];

  // Fish out inner arrow <div> inside the tooltip <div>
  const arrowElement = tooltipElement.querySelector(".tooltip_arrow");

  if (arrowElement) {
    middleware.push(arrow({ element: arrowElement }));
  }

  // - Update tooltip position
  computePosition(linkElement, tooltipElement, {
    placement: "bottom",
    middleware,
  }).then(({ x, y, placement, middlewareData }) => {
    // Position tooltip
    Object.assign(tooltipElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    // Position tooltip arrow
    if (arrowElement && middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow;

      const placementInversionMap: Record<string, string> = {
        top: "bottom",
        right: "left",
        bottom: "top",
        left: "right",
      };

      const tooltipPlacementSide = placement.split("-")[0]; // Simplify chosen placement side (i.e. drop `-start`, ...)
      const arrowSide = placementInversionMap[tooltipPlacementSide]; // Invert side (e.g. top -> bottom, ...)

      Object.assign((arrowElement as HTMLElement).style, {
        left: arrowX != null ? `${arrowX}px` : "",
        top: arrowY != null ? `${arrowY}px` : "",
        right: "",
        bottom: "",
        [arrowSide]: "-4px",
      });
    }
  });

  // Show tooltip
  tooltipElement.style.display = "block";

  // Commit state
  theWordsActiveWordKey = wordKey;
}

function hideWordTooltip() {
  // Cancel previously active timer, if any
  cancelHideTooltipTimer();

  // Schedule hiding tooltip after a delay
  theWordsHideTooltipTimer = window.setTimeout(
    hideActiveWordTooltip,
    theWordsTooltip_DelayBeforeClosing_msec
  );
}

//
// Build index, if page wants one
// (do this before we build and bind the tooltips below so these also get tooltip'd)
//

const wordIndexParentDiv = document.querySelector<HTMLDivElement>("#the_words_index");
const wordIndexKeyToAnchorMap = new Map<string, HTMLAnchorElement>();

if (wordIndexParentDiv) {
  // Clear "Loading..." message
  wordIndexParentDiv.innerHTML = "";

  // Populate content
  theWordsDb.DisplayNamesInDisplayOrder.forEach((displayName, index) => {
    const wordKey = wordKeyFromWord(displayName);

    if (index > 0) {
      // Add spacer in parent div
      wordIndexParentDiv.appendChild(document.createTextNode(" \u2022 "));
    }

    // Create <a>
    const anchorElement = document.createElement("a");

    // Configure <a>
    anchorElement.classList.add("the_words_index_word");
    anchorElement.href = theWordsLinkPrefix + "_" + wordKey;

    // Create and append content
    anchorElement.appendChild(document.createTextNode(displayName));

    // Add to parent div
    wordIndexParentDiv.appendChild(anchorElement);

    // Commit state
    wordIndexKeyToAnchorMap.set(wordKey, anchorElement);
  });
}

//
// Build and bind tooltips
//

// Find all eligible tooltip sources: anchors with an href starting with (thus ^=) our link prefix
const allWordsLinks = document.querySelectorAll(`a[href^="${theWordsLinkPrefix}"]`);

// Bind listeners for all tooltip sources
allWordsLinks.forEach((linkElement) => {
  function inferWordKeyFromLink(linkElement: HTMLAnchorElement) {
    // Link elements' `href` will contain a full URI at runtime -> find our local link prefix
    const linkPrefixIndex = linkElement.href.indexOf(theWordsLinkPrefix);

    if (linkPrefixIndex < 0) {
      // Invalid link
      return undefined;
    }

    const linkPrefixRemainder = linkElement.href.slice(linkPrefixIndex + theWordsLinkPrefix.length);

    if (linkPrefixRemainder.length === 0) {
      // Infer theWords key from the word(s) within the link
      if (!linkElement.textContent) {
        return undefined;
      }

      // Remove punctuation-style characters that might be included in the link text
      // so they don't contaminate our word lookup.
      const linkText = linkElement.textContent.replace(/[.,'"“”]/g, "");

      return wordKeyFromWord(linkText);
    }

    if (linkPrefixRemainder[0] === "_") {
      // TheWords key is specified within the anchor itself
      return linkPrefixRemainder.slice(1);
    }

    return undefined;
  }

  // Build local (i.e. from site-of-use) word key (see comment on "canonical" word key below)
  const localWordKey = inferWordKeyFromLink(linkElement as HTMLAnchorElement);

  if (!localWordKey) {
    // Invalid link - ignore
    return;
  }

  // Try to retrieve definition from database
  const displayName = theWordsDb.KeyToDisplayName.get(localWordKey);

  if (!displayName) {
    // Invalid link - ignore
    console.log(`TheWords: term "${localWordKey}" not found.`);
    return;
  }

  const wordDefinition = theWordsDb.DisplayNameToDefinition.get(displayName);

  if (!wordDefinition) {
    // Invalid link - ignore
    console.log(`TheWords: term "${localWordKey}" not found.`);
    return;
  }

  // Infer "canonical" word key from base displayName
  // - For example, if the underlying display name is "Upstage/Downstage" (which gets split into "Upstage/Downstage", "Upstage", and "Downstage"),
  //   use the canonical displayName "Upstage/Downstage" to build the canonical word key "upstage_downstage".
  //   This way we don't build tooltips for "upstage_downstage" _and_ "upstage" etc.
  const canonicalWordKey = wordKeyFromWord(displayName);

  // Build tooltip element, if it hasn't been built previously for this key
  if (theWordsTooltips.get(canonicalWordKey) === undefined) {
    theWordsTooltips.set(canonicalWordKey, buildTheWordsTooltipElement(canonicalWordKey));
  }

  // Apply settings to link element
  // - Data (so we can find the theWords key later)
  linkElement.setAttribute(theWordsKeyAttribute, canonicalWordKey);

  // - Remove link destination (no longer need this to function as an actual link)
  linkElement.removeAttribute("href");

  // - Styling
  linkElement.classList.add("tooltip_button");

  // - Accessibility
  linkElement.setAttribute("aria-describedby", theWordsTooltips.get(canonicalWordKey)?.id ?? "");

  // Bind listeners
  linkElement.addEventListener("mouseenter", showWordTooltip);
  linkElement.addEventListener("focus", showWordTooltip);

  linkElement.addEventListener("mouseleave", hideWordTooltip);
  linkElement.addEventListener("blur", hideWordTooltip);
});

//
// Search functionality
//

function onWordSearchTermUpdate(event: Event) {
  const searchTerm = (event.target as HTMLInputElement).value;

  if (searchTerm === theWordsCurrentSearchTerm) {
    // No updates needed
    return;
  }

  // Commit search term
  theWordsCurrentSearchTerm = searchTerm;

  // Process updates
  function updateActiveTooltip() {
    if (!theWordsActiveWordKey) {
      return;
    }

    const tooltipElement = theWordsTooltips.get(theWordsActiveWordKey);

    if (tooltipElement === undefined) {
      return;
    }

    updateTheWordsTooltipBody(theWordsActiveWordKey, tooltipElement);
  }

  if (!searchTerm) {
    // Search ended
    // - Restore state and visibility on all links
    for (const anchorElement of wordIndexKeyToAnchorMap.values()) {
      setSearchResultForElement(anchorElement, "none");
      anchorElement.style.opacity = "100%";
    }

    // - Update currently shown tooltip, if any
    updateActiveTooltip();

    return;
  }

  // Search word keys (these are already conformed to lowercase)...
  const searchTermAsWordKey = wordKeyFromWord(searchTerm);

  // ...and definitions (use a regular expression for case-insensitive search)
  const searchTermRegEx = new RegExp(searchTerm, "i");

  for (const [wordKey, anchorElement] of wordIndexKeyToAnchorMap) {
    // Slightly odd inline anonymous function invocations below so we can do hot returns...
    const searchResult = (function (): SearchResult {
      if (wordKey.includes(searchTermAsWordKey)) {
        return "match-by-term";
      }

      const displayName = anchorElement.innerText;
      const definitionText = theWordsDb.DisplayNameToDefinition.get(displayName);

      if (definitionText && searchTermRegEx.test(definitionText)) {
        return "match-by-definition";
      }

      return "unmatched";
    })();

    setSearchResultForElement(anchorElement, searchResult);

    const anchorOpacity = (function (): number {
      switch (searchResult) {
        case "match-by-term":
          return 100;
        case "match-by-definition":
          return 50;
        case "unmatched":
        default:
          return 10;
      }
    })();

    anchorElement.style.opacity = `${anchorOpacity}%`;
  }

  // Update currently shown tooltip, if any
  updateActiveTooltip();
}

const theWordsSearchButton = document.querySelector<HTMLInputElement>(
  "input#the_words_search_input"
);

if (theWordsSearchButton) {
  theWordsSearchButton.addEventListener("input", onWordSearchTermUpdate);
}
