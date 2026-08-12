//
// Randomize the order of figures in a gallery section marked with id="randomizegallery".
//
// Covers both Squarespace gallery layouts we use: the "masonry" grid (figure.gallery-masonry-item)
// and the "slideshow" (figure.gallery-slideshow-item). Squarespace's own slideshow controller is
// loaded from a separate, asynchronously-fetched script chunk, so it hasn't scanned the DOM yet by
// the time this (synchronous, last-on-page) script runs -- reordering the figures here is picked up
// as the original order once that controller does mount.
//

// Squarespace's slideshow bakes these onto whichever figure it renders as the first/active slide
// server-side. They're rendered directly (position-independent), so if we shuffle the figures but
// leave these where they are, the original "first" slide stays visible until the (asynchronously
// loaded) slideshow controller mounts and re-assigns them to the new first figure -- causing a
// visible pop from the original image to the shuffled one.
const SLIDESHOW_ACTIVE_STATE_ATTRIBUTES = ["data-active", "data-in", "data-next"];

function shuffleFigures(randomizeGallerySection: HTMLElement, figureSelector: string): void {
  const figures = Array.from(randomizeGallerySection.querySelectorAll<HTMLElement>(figureSelector));

  if (figures.length <= 1) {
    return;
  }

  const container = figures[0].parentElement;

  if (!container) {
    return;
  }

  const activeStateAttributes: string[] = [];

  for (const figure of figures) {
    for (const attribute of SLIDESHOW_ACTIVE_STATE_ATTRIBUTES) {
      if (figure.hasAttribute(attribute)) {
        activeStateAttributes.push(attribute);
        figure.removeAttribute(attribute);
      }
    }
  }

  // Fisher-Yates shuffle
  for (let i = figures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [figures[i], figures[j]] = [figures[j], figures[i]];
  }

  activeStateAttributes.forEach((attribute) => {
    figures[0].setAttribute(attribute, "true");
  });

  figures.forEach((figure) => container.appendChild(figure));
}

const randomizeGallerySection = document.querySelector<HTMLElement>("section#randomizegallery");

if (randomizeGallerySection) {
  shuffleFigures(randomizeGallerySection, "figure.gallery-masonry-item");
  shuffleFigures(randomizeGallerySection, "figure.gallery-slideshow-item");
}
