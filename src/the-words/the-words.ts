import { computePosition, shift, offset, arrow } from "@floating-ui/dom";
import { theWordsList } from "./the-words-list";

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

const theWordsTooltip_OffsetFromParent = 5;

const theWordsTooltip_DelayBeforeClosing_msec = 1000;

// TheWords database
function wordKeyFromWord(word: string) {
  return word
    .toLowerCase()
    .replace(/[`'“’]/g, "")
    .replace(/ /g, "_");
}

const theWordsKeyToDefinition = new Map<string, string>();
const theWordsKeyToDisplayName = new Map<string, string>();

theWordsList.forEach(([wordDisplayName, wordDefinition]) => {
  // Words may have multiple keys, e.g. "Flop/Floppies" -> break on slash...
  const splitWordDisplayNames = wordDisplayName.split("/");

  // ...and insert each as their own entry
  splitWordDisplayNames.forEach((wordDisplayName_Single) => {
    // Transpose word keys from natural/display case to programmatic case (e.g. 'Foo Bar' -> 'foo_bar')
    const wordKey = wordKeyFromWord(wordDisplayName_Single);

    theWordsKeyToDefinition.set(wordKey, wordDefinition);
    theWordsKeyToDisplayName.set(wordKey, wordDisplayName);
  });

  if (splitWordDisplayNames.length > 1) {
    // ...and also insert the original combined word key so the Index lookup works
    const wordKey = wordKeyFromWord(wordDisplayName);

    theWordsKeyToDefinition.set(wordKey, wordDefinition);
    theWordsKeyToDisplayName.set(wordKey, wordDisplayName);
  }
});

// State
// - Map of tooltips (starts empty, built out as we identify links requiring tooltips on the page)
//   NOTE: We inject tooltip <div>'s for each identified link so screen readers can follow them via `aria-labelledby="the-div's-id"`,
//         rather than instantiating a tooltip transiently on hover (though that would be more efficient).
const theWordsTooltips = new Map<string, HTMLDivElement>();

// - Latest search term
let theWordsCurrentSearchTerm = "";

// - Active tooltip
let theWordsActiveWordKey: string | undefined = undefined;
let theWordsHideTooltipTimer: number | undefined = undefined;

//
// Building tooltips
//

function updateTheWordsTooltipBody(wordKey: string, divElement: HTMLDivElement) {
  // Clear out any old content
  divElement.innerHTML = "";

  // Term
  const displayName = theWordsKeyToDisplayName.get(wordKey);

  if (displayName) {
    const termElement = document.createElement("span");
    termElement.appendChild(document.createTextNode(`${displayName}:`));
    termElement.classList.add("tooltip_term");

    divElement.appendChild(termElement);
  }

  // Definition
  const definitionText = theWordsKeyToDefinition.get(wordKey) ?? "";

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

  const wordKey = linkElement.getAttribute(theWordsKeyAttribute);

  if (wordKey === null) {
    return;
  }

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
  theWordsList
    .map((x) => x[0])
    .forEach((theWord, idx) => {
      const wordKey = wordKeyFromWord(theWord);

      if (idx > 0) {
        // Add spacer in parent div
        wordIndexParentDiv.appendChild(document.createTextNode(" \u2022 "));
      }

      // Create <a>
      const anchorElement = document.createElement("a");

      // Configure <a>
      anchorElement.classList.add("the_words_index_word");
      anchorElement.href = theWordsLinkPrefix + "_" + wordKey;

      // Create and append content
      anchorElement.appendChild(document.createTextNode(theWord));

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

  const wordKey = inferWordKeyFromLink(linkElement as HTMLAnchorElement);

  if (wordKey === undefined) {
    // Invalid link - ignore
    return;
  }

  // Try to retrieve definition from database
  const wordDefinition = theWordsKeyToDefinition.get(wordKey);

  if (wordDefinition === undefined) {
    // Invalid link - ignore
    console.log(`TheWords: term "${wordKey}" not found.`);
    return;
  }

  // Build tooltip element, if it hasn't been built previously for this key
  if (theWordsTooltips.get(wordKey) === undefined) {
    theWordsTooltips.set(wordKey, buildTheWordsTooltipElement(wordKey));
  }

  // Apply settings to link element
  // - Data (so we can find the theWords key later)
  linkElement.setAttribute(theWordsKeyAttribute, wordKey);

  // - Remove link destination (no longer need this to function as an actual link)
  linkElement.removeAttribute("href");

  // - Styling
  linkElement.classList.add("tooltip_button");

  // - Accessibility
  linkElement.setAttribute("aria-describedby", theWordsTooltips.get(wordKey)?.id ?? "");

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
    // - Restore visibility on all links
    for (const anchorElement of wordIndexKeyToAnchorMap.values()) {
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
    const anchorOpacity = (function () {
      if (wordKey.includes(searchTermAsWordKey)) {
        // Show term fully when we match the term
        return 100;
      }

      const definitionText = theWordsKeyToDefinition.get(wordKey);

      if (definitionText && searchTermRegEx.test(definitionText)) {
        // Show term partially when we match just the definition
        return 50;
      }

      // Show the term a little when it does not match
      return 10;
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
