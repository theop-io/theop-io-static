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

  const figureCaptionElement = document.createElement("figcaption");
  figureCaptionElement.appendChild(document.createTextNode(imageElement.alt));

  figureElement.appendChild(figureCaptionElement);
});
