import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

// Types
class VideoDescriptor {
  readonly id: string;
  readonly description: string;

  constructor(id: string, description: string) {
    this.id = id;
    this.description = description;
  }

  getVideoUrl() {
    return `https://www.youtube.com/watch?v=${this.id}`;
  }

  getThumbnailUrl() {
    return `https://i3.ytimg.com/vi/${this.id}/hqdefault.jpg`;
  }
}

// Build carousel list
function showCarouselForVideo(videoDescriptors: VideoDescriptor[], videoIndex: number) {
  const carouselVideoList = videoDescriptors.map((videoDescriptor) => {
    return {
      src: videoDescriptor.getVideoUrl(),
      thumb: videoDescriptor.getThumbnailUrl(),
    };
  });

  Fancybox.show(carouselVideoList, {
    startIndex: videoIndex,
  });
}

// Populate videos
const youtubeLibraryParentDiv = document.querySelector<HTMLDivElement>("#youtube-library-fancybox");

if (youtubeLibraryParentDiv) {
  // Retrieve video links from inner <a> elements
  const videoLinkElements = Array.from(
    youtubeLibraryParentDiv.querySelectorAll<HTMLAnchorElement>("a")
  );

  const videoDescriptors = videoLinkElements
    .map((videoLinkElement) => {
      const url = videoLinkElement.href;

      // Strip `https://youtu.be/` prefix
      const youtubeLinkPrefix = "https://youtu.be/";

      if (!url.startsWith(youtubeLinkPrefix)) {
        return null;
      }

      return new VideoDescriptor(
        url.substring(youtubeLinkPrefix.length),
        videoLinkElement.innerText
      );
    })
    .filter((v): v is VideoDescriptor => v != null);

  // Remove "Loading..." etc. content
  youtubeLibraryParentDiv.innerHTML = "";

  // Populate videos
  videoDescriptors.forEach((videoDescriptor, index) => {
    // Generate description div
    const descriptionElement = document.createElement("span");

    descriptionElement.classList.add("youtube-library-description");
    descriptionElement.appendChild(document.createTextNode(videoDescriptor.description));

    // Generate play button SVG
    const playButtonElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    playButtonElement.classList.add("youtube-library-play-button");
    playButtonElement.setAttribute("viewBox", "0 0 1200 1200");

    {
      const playButtonBackingRectangle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );

      playButtonBackingRectangle.setAttribute("x", "400");
      playButtonBackingRectangle.setAttribute("y", "320");
      playButtonBackingRectangle.setAttribute("width", "500");
      playButtonBackingRectangle.setAttribute("height", "550");

      playButtonBackingRectangle.setAttribute("style", "fill:white;");

      playButtonElement.appendChild(playButtonBackingRectangle);
    }

    {
      const playButtonPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

      playButtonPath.setAttribute(
        "d",
        "m1171.9 340.5c-17.625-76.688-103.12-151.88-178.12-163.31-261.24-36.324-526.26-36.324-787.5 0-75 11.438-161.25 86.625-178.88 163.31-37.5 170.97-37.5 348.03 0 519 18.375 76.688 103.88 151.88 178.88 163.31 260.75 36.188 525.25 36.188 786 0 75-11.438 161.25-86.625 178.88-163.31 37.746-170.91 38.004-347.98 0.75-519zm-703.12 503.25v-487.5l375 243.75z"
      );

      playButtonPath.setAttribute("style", "fill:rgb(255,0,3);fill-rule:nonzero;");

      playButtonElement.appendChild(playButtonPath);
    }

    // Generate preview image
    const imageElement = document.createElement("img");

    imageElement.id = `youtubeImage${index}`;
    imageElement.classList.add("youtube-library-preview");
    imageElement.src = videoDescriptor.getThumbnailUrl();

    // Generate outer div
    const outerDivElement = document.createElement("div");

    outerDivElement.classList.add("youtube-library-float");

    outerDivElement.addEventListener("click", () => {
      showCarouselForVideo(videoDescriptors, index);
    });

    // Insert img and svg into outer div
    outerDivElement.appendChild(descriptionElement);
    outerDivElement.appendChild(playButtonElement);
    outerDivElement.appendChild(imageElement);

    // Insert outer div into parent div
    youtubeLibraryParentDiv.appendChild(outerDivElement);
  });
}
