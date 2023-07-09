import { computePosition, autoPlacement, offset, arrow } from "@floating-ui/dom";
import { wordsList } from "./words-list";

// How to reference glossary entries:
// <a href="#glossary_termFoo">Blah blah</a> -> finds the definition for glossary key `termFoo`; the anchor text (i.e. the reference) may be anything
// <a href="#glossary">word</a> -> finds the definition for glossary key `word`, i.e. the anchor body _is_ the key (case-insensitive, will convert spaces to underscores)

//
// Configuration
//

// Glossary configuration
const glossaryLinkPrefix = "#glossary"; // Used to identify glossary links when configuring the page
const glossaryKeyAttribute = "data-glossary-key"; // Used to find glossary key after page has been configured

const glossaryTooltip_OffsetFromParent = 5;

// Glossary database
const glossaryDb = new Map<string, string>(wordsList);

// Glossary tooltips (starts empty)
const glossaryTooltips = new Map<string, HTMLElement>();

//
// Building tooltips
//

function buildTooltipElement(glossaryKey: string): HTMLDivElement {
  // Create <div>
  const divElement = document.createElement("div");

  // Configure <div>
  divElement.classList.add("tooltip_popup");
  divElement.role = "tooltip";
  divElement.id = `tooltip_popup_${glossaryKey}`;

  // Create and append content
  divElement.appendChild(document.createTextNode(glossaryDb.get(glossaryKey) ?? ""));

  // Create and append inner arrow <div>
  const arrowDivElement = document.createElement("div");
  arrowDivElement.classList.add("tooltip_arrow");
  divElement.appendChild(arrowDivElement);

  // Add to document
  document.body.appendChild(divElement);

  return divElement;
}

//
// Listeners
//

function showGlossaryTooltip(event: Event) {
  const linkElement = event.target as HTMLLinkElement;

  const glossaryKey = linkElement.getAttribute(glossaryKeyAttribute);

  if (glossaryKey === null) {
    return;
  }

  const tooltipElement = glossaryTooltips.get(glossaryKey);

  if (tooltipElement === undefined) {
    return;
  }

  // Build core middleware for FloatingUI
  const middleware = [
    offset(glossaryTooltip_OffsetFromParent), // Provide some spacing between button and tooltip
    autoPlacement(), // Automatically place on side with the most space
  ];

  // Fish out inner arrow <div> inside the tooltip <div>
  const arrowElement = tooltipElement.querySelector(".tooltip_arrow");

  if (arrowElement) {
    middleware.push(arrow({ element: arrowElement }));
  }

  // Update tooltip position
  computePosition(linkElement, tooltipElement, {
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
}

function hideGlossaryTooltip(event: Event) {
  const linkElement = event.target as HTMLLinkElement;

  const glossaryKey = linkElement.getAttribute(glossaryKeyAttribute);

  if (glossaryKey === null) {
    return;
  }

  const tooltipElement = glossaryTooltips.get(glossaryKey);

  if (tooltipElement === undefined) {
    return;
  }

  // Hide tooltip
  tooltipElement.style.display = "";
}

//
// Build and bind tooltips
//

// Find all eligible tooltip sources: anchors with an href starting with (thus ^=) our link prefix
const allLinks = document.querySelectorAll(`a[href^="${glossaryLinkPrefix}"]`);

// Bind listeners for all tooltip sources
allLinks.forEach((linkElement) => {
  function inferGlossaryKeyFromLink(linkElement: HTMLAnchorElement) {
    // Link elements' `href` will contain a full URI at runtime -> find our local link prefix
    const linkPrefixIndex = linkElement.href.indexOf(glossaryLinkPrefix);

    if (linkPrefixIndex < 0) {
      // Invalid link
      return undefined;
    }

    const linkPrefixRemainder = linkElement.href.slice(linkPrefixIndex + glossaryLinkPrefix.length);

    if (linkPrefixRemainder.length === 0) {
      // Infer glossary key from the word(s) within the link
      return linkElement.textContent?.toLowerCase().replace(/ /g, "_") ?? undefined;
    }

    if (linkPrefixRemainder[0] === "_") {
      // Glossary key is specified within the anchor itself
      return linkPrefixRemainder.slice(1);
    }

    return undefined;
  }

  const glossaryKey = inferGlossaryKeyFromLink(linkElement as HTMLAnchorElement);

  if (glossaryKey === undefined) {
    // Invalid link - ignore
    return;
  }

  // Try to retrieve definition from database
  const glossaryDefinition = glossaryDb.get(glossaryKey);

  if (glossaryDefinition === undefined) {
    // Invalid link - ignore
    return;
  }

  // Build tooltip element, if it hasn't been built previously for this key
  if (glossaryTooltips.get(glossaryKey) === undefined) {
    glossaryTooltips.set(glossaryKey, buildTooltipElement(glossaryKey));
  }

  // Apply settings to link element
  // - Data (so we can find the glossary key later)
  linkElement.setAttribute(glossaryKeyAttribute, glossaryKey);

  // - Remove link destination (no longer need this to function as an actual link)
  linkElement.removeAttribute("href");

  // - Styling
  linkElement.classList.add("tooltip_button");

  // - Accessibility
  linkElement.setAttribute("aria-describedby", glossaryTooltips.get(glossaryKey)?.id ?? "");

  // Bind listeners
  linkElement.addEventListener("mouseenter", showGlossaryTooltip);
  linkElement.addEventListener("focus", showGlossaryTooltip);

  linkElement.addEventListener("mouseleave", hideGlossaryTooltip);
  linkElement.addEventListener("blur", hideGlossaryTooltip);
});
