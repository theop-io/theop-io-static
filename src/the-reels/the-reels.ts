import {
  appendChildren,
  createElementWithInitializerAndChildren,
  createAnchorElementWithChildren,
  displayNotFound,
} from "../shared/display-tools";
import { displayEmbeddedVideo } from "../shared/video-embed";

import { TheReels } from "./generated/the-reels-db";

import { Reel } from "./the-reels-types";
import { urlForOperator } from "./the-reels-shared";

//
// Data tools
//

function getURLFor(additionalParameters?: { [key: string]: string }): URL {
  const url = new URL(window.location.href.split("?")[0]); // Strip existing searchParams

  if (additionalParameters) {
    Object.keys(additionalParameters).forEach((key) =>
      url.searchParams.append(key, additionalParameters[key])
    );
  }

  return url;
}

function operatorFromURL(urlParams: URLSearchParams): string | undefined {
  const operatorName = urlParams.get("operatorName");
  return operatorName ?? undefined;
}

function reelFromURL(urlParams: URLSearchParams): Reel | undefined {
  const operatorName = operatorFromURL(urlParams);

  const reels = TheReels.filter((reel) => reel.operatorName === operatorName);

  if (!reels || reels.length !== 1) {
    return undefined;
  }

  return reels[0];
}

const seenReelsStorageKey = "the-reels-seen";
const seenReelsSeparator = ";";

function getPreviouslySeenReels() {
  return new Set(localStorage.getItem(seenReelsStorageKey)?.split(seenReelsSeparator) ?? []);
}

function setPreviouslySeenReels(seenReels: Set<string>) {
  localStorage.setItem(seenReelsStorageKey, Array.from(seenReels).join(seenReelsSeparator));
}

function clearPreviouslySeenReels() {
  localStorage.removeItem(seenReelsStorageKey);
}

function buildRandomReelURL(): URL {
  function getRandomArrayElement<T>(data: T[]): T {
    return data[Math.floor(Math.random() * data.length)];
  }

  const previouslySeenReels = getPreviouslySeenReels();

  let eligibleReels = TheReels.filter((reel) => !previouslySeenReels.has(reel.operatorName));

  if (!eligibleReels.length) {
    // We've now seen all reels -> reset
    clearPreviouslySeenReels();

    // ...and consider all possible reels
    eligibleReels = TheReels;
  }

  const randomReel = getRandomArrayElement(eligibleReels);

  return getURLFor(urlForOperator(randomReel.operatorName));
}

//
// Display: Reel
//

function displayReelDetails(urlParams: URLSearchParams): HTMLElement[] {
  // Find reel
  const reel = reelFromURL(urlParams);

  if (!reel) {
    return displayNotFound();
  }

  // Persist that we've viewed this reel
  {
    const previouslySeenReels = getPreviouslySeenReels();
    previouslySeenReels.add(reel.operatorName);
    setPreviouslySeenReels(previouslySeenReels);
  }

  // Create display
  return [
    // Header row div: name and contact info
    createElementWithInitializerAndChildren(
      "div",
      (element) => element.classList.add("the_reels_header_row"),
      // - Operator name
      createElementWithInitializerAndChildren(
        "span",
        (element) => element.classList.add("the_reels_operator_name"),
        `${reel.operatorName} (${reel.operatorActiveSinceYear})`
      ),
      // - Contact info
      createElementWithInitializerAndChildren(
        "span",
        (element) => element.classList.add("the_reels_contact_info"),
        ...(reel.operatorContactInfo.email
          ? [
              createElementWithInitializerAndChildren("a", (element) => {
                // Link substance
                element.href = new URL(`mailto:${reel.operatorContactInfo.email}`).href;
                element.target = "_blank";
                element.rel = "noopener noreferrer";

                // Link style
                element.classList.add("contact-link", "svg-logo-mail");
              }),
            ]
          : []),
        ...(reel.operatorContactInfo.instagram
          ? [
              createElementWithInitializerAndChildren("a", (element) => {
                // Link substance
                element.href = new URL(
                  `https://instagram.com/${reel.operatorContactInfo.instagram}/`
                ).href;
                element.target = "_blank";
                element.rel = "noopener noreferrer";

                // Link style
                element.classList.add("contact-link", "svg-logo-instagram");
              }),
            ]
          : []),
        ...(reel.operatorContactInfo.url
          ? [
              createElementWithInitializerAndChildren("a", (element) => {
                // Link substance
                element.href = new URL(`https://${reel.operatorContactInfo.url}/`).href;
                element.target = "_blank";
                element.rel = "noopener noreferrer";

                // Link style
                element.classList.add("contact-link", "svg-logo-www");
              }),
            ]
          : [])
      )
    ),
    // Subheader row div: navigation
    createElementWithInitializerAndChildren(
      "div",
      (element) => element.classList.add("the_reels_subheader_row"),
      // - Next (random) reel button
      createAnchorElementWithChildren(buildRandomReelURL(), "Show me another reel")
    ),
    // Main row: reel video
    displayEmbeddedVideo(reel.videoRef),
  ];
}

//
// Top-level
//

// Find and populate per-reel page wrapper element
const reelsParentDiv = document.querySelector<HTMLDivElement>("#the_reels_wrapper");

if (reelsParentDiv) {
  // Clear "Loading..." message
  reelsParentDiv.innerHTML = "";

  // Configure styling
  reelsParentDiv.classList.add("the_reels");

  // Setup
  const urlParams = new URLSearchParams(window.location.search);

  const operatorName = operatorFromURL(urlParams);

  if (!operatorName) {
    // Home page -> go to a random reel
    window.location.replace(buildRandomReelURL());
  } else {
    // Show content
    appendChildren(reelsParentDiv, displayReelDetails(urlParams));
  }
}
