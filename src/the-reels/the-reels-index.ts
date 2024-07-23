import {
  appendChildren,
  createElementWithChildren,
  createAnchorElementWithChildren,
} from "../shared/display-tools";

import { TheReels } from "./generated/the-reels-db";

import { Reel } from "./the-reels-types";
import { urlForOperator } from "./the-reels-shared";

// Find and populate index page wrapper element (for debugging)
const reelsIndexParentDiv = document.querySelector<HTMLDivElement>("#the_reels_index_wrapper");

if (reelsIndexParentDiv) {
  const displayPageUrl = reelsIndexParentDiv.dataset.displayPageUrl;

  if (displayPageUrl) {
    // Clear "Loading..." message
    reelsIndexParentDiv.innerHTML = "";

    // Configure styling
    reelsIndexParentDiv.classList.add("the_reels");

    // Insert index
    const urlForReel = (reel: Reel) => {
      const url = new URL(displayPageUrl, window.location.href);
      const additionalParameters: { [key: string]: string } = urlForOperator(reel.operatorName);

      Object.keys(additionalParameters).forEach((key) =>
        url.searchParams.append(key, additionalParameters[key])
      );

      return url;
    };

    appendChildren(reelsIndexParentDiv, [
      createElementWithChildren(
        "ul",
        ...TheReels.map((reel) =>
          createElementWithChildren(
            "li",
            createAnchorElementWithChildren(
              urlForReel(reel),
              `${reel.operatorName} (${reel.operatorActiveSinceYear})`
            )
          )
        )
      ),
    ]);
  }
}
