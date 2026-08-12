//
// Randomize the order of figures in a gallery section marked with id="randomizegallery".
//
// Covers both Squarespace gallery layouts we use: the "masonry" grid (figure.gallery-masonry-item)
// and the "slideshow" (figure.gallery-slideshow-item). Squarespace's own slideshow controller is
// loaded from a separate, asynchronously-fetched script chunk, so it hasn't scanned the DOM yet by
// the time this (synchronous, last-on-page) script runs -- reordering the figures here is picked up
// as the original order once that controller does mount.
//

function shuffleFigures(randomizeGallerySection: HTMLElement, figureSelector: string): void {
  const figures = Array.from(randomizeGallerySection.querySelectorAll<HTMLElement>(figureSelector));

  if (figures.length <= 1) {
    return;
  }

  const container = figures[0].parentElement;

  if (!container) {
    return;
  }

  // Fisher-Yates shuffle
  for (let i = figures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [figures[i], figures[j]] = [figures[j], figures[i]];
  }

  figures.forEach((figure) => container.appendChild(figure));
}

const randomizeGallerySection = document.querySelector<HTMLElement>("section#randomizegallery");

if (randomizeGallerySection) {
  shuffleFigures(randomizeGallerySection, "figure.gallery-masonry-item");
  shuffleFigures(randomizeGallerySection, "figure.gallery-slideshow-item");
}
