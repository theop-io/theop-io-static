//
// Randomize the order of figures in a gallery section marked with id="randomizegallery"
//

const randomizeGallerySection = document.querySelector<HTMLElement>("section#randomizegallery");

if (randomizeGallerySection) {
  const figures = Array.from(
    randomizeGallerySection.querySelectorAll<HTMLElement>("figure.gallery-masonry-item")
  );

  if (figures.length > 1) {
    const container = figures[0].parentElement;

    if (container) {
      // Fisher-Yates shuffle
      for (let i = figures.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [figures[i], figures[j]] = [figures[j], figures[i]];
      }

      figures.forEach((figure) => container.appendChild(figure));
    }
  }
}
