//
// Find images in image gallery lightboxes and inject captions for them
//

// Find descriptions from figures in gallery on page
const galleryItemIdToDescription = new Map<string, string>();

const galleryMasonryFigures = document.querySelectorAll<HTMLElement>("figure.gallery-masonry-item");

galleryMasonryFigures.forEach((figureElement) => {
  // Find link to lightbox
  const lightboxLinkElement = figureElement.querySelector<HTMLLinkElement>(
    "a.gallery-masonry-lightbox-link"
  );

  if (!lightboxLinkElement) {
    return;
  }

  // Extract itemId from link
  const linkParams = new URL(lightboxLinkElement.href).searchParams;
  const itemId = linkParams.get("itemId");

  if (!itemId) {
    return;
  }

  // Find description
  const descriptionElement = figureElement.querySelector<HTMLElement>("p.gallery-caption-content");

  if (!descriptionElement) {
    return;
  }

  galleryItemIdToDescription.set(itemId, descriptionElement.innerText);
});

// Apply captions to figures inside lightbox
const galleryLightboxFigures = document.querySelectorAll<HTMLElement>(
  "figure.gallery-lightbox-item"
);

galleryLightboxFigures.forEach((figureElement) => {
  const captionText = (function () {
    // Try to locate our previously-saved description
    const slideUrl = figureElement.getAttribute("data-slide-url");

    if (slideUrl) {
      const existingDescription = galleryItemIdToDescription.get(slideUrl);

      if (existingDescription) {
        return existingDescription;
      }
    }

    // Try to locate an `alt` text from the enclosed <img> instead (not ideal because Squarespace truncates long descriptions)
    const imageElement = figureElement.querySelector("img");

    if (!imageElement) {
      return null;
    }

    if (!imageElement.alt) {
      return null;
    }

    if (imageElement.src.endsWith(encodeURIComponent(imageElement.alt))) {
      // If no description (`alt` text) is specified, SquareSpace uselessly injects the name of the file.
      // In that case, don't create a caption for this.
      return null;
    }

    return imageElement.alt;
  })();

  if (captionText) {
    const figureCaptionElement = document.createElement("figcaption");
    figureCaptionElement.appendChild(document.createTextNode(captionText));

    figureElement.appendChild(figureCaptionElement);
  }
});
