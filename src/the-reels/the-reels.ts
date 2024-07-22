import {
  appendChildren,
  createElementWithChildren,
  createElementWithInitializerAndChildren,
  createAnchorElementWithChildren,
  displayNotFound,
} from "../shared/display-tools";

import { TheReels } from "./generated/the-reels-db";

import { Reel } from "./the-reels-types";

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

function urlForOperator(operatorName: string) {
  return { operatorName };
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

function buildRandomReelURL(): URL {
  function getRandomArrayElement<T>(data: T[]): T {
    return data[Math.floor(Math.random() * data.length)];
  }

  const randomReel = getRandomArrayElement(TheReels);

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

  // Create display
  return [
    // Header row div
    createElementWithInitializerAndChildren(
      "div",
      (element) => element.classList.add("the_reels_header_row"),
      // - Operator name
      createElementWithInitializerAndChildren(
        "span",
        (element) => element.classList.add("the_reels_operator_name"),
        reel.operatorName
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
      ),
      // - Next (random) reel button
      createElementWithInitializerAndChildren(
        "span",
        (element) => element.classList.add("the_reels_another_link"),
        createAnchorElementWithChildren(buildRandomReelURL(), "Show me another reel")
      )
    ),
    // Main row: reel video
    ...(reel.vimeoId
      ? [
          createElementWithInitializerAndChildren(
            "div",
            (element) => element.classList.add("the_reels_video_container"),
            createElementWithInitializerAndChildren("iframe", (element) => {
              element.src = `https://player.vimeo.com/video/${reel.vimeoId}`;
              element.allow = "encrypted-media";
              element.allowFullscreen = true;
            })
          ),
        ]
      : []),
  ];
}

//
// Top-level
//

// Find and populate index wrapper element
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
