//
// Find images in image gallery lightboxes and inject captions for them
//

const galleryLightboxFigures = document.querySelectorAll<HTMLElement>(
  "figure.gallery-lightbox-item"
);

galleryLightboxFigures.forEach((figureElement) => {
  const imageElement = figureElement.querySelector("img");

  if (!imageElement) {
    return;
  }

  if (!imageElement.alt) {
    return;
  }

  if (imageElement.src.endsWith(imageElement.alt)) {
    // If no description (`alt` text) is specified, SquareSpace uselessly injects the name of the file.
    // In that case, don't create a caption for this.
    return;
  }

  console.log(`Src: "${imageElement.src}", alt: "${imageElement.alt}"`);

  const figureCaptionElement = document.createElement("figcaption");
  figureCaptionElement.appendChild(document.createTextNode(imageElement.alt));

  figureElement.appendChild(figureCaptionElement);
});
