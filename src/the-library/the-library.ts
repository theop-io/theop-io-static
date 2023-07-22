import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

// Types
class VideoDescriptor {
  readonly type: "youtube" | "vimeo" | "invalid";
  readonly id: string;
  readonly description: string;

  constructor(url: string, description: string) {
    const youtubeLinkPrefix = "https://youtu.be/";
    const vimeoLinkPrefix = "https://vimeo.com/";

    // Parse potential YouTube URL
    if (url.startsWith(youtubeLinkPrefix)) {
      this.type = "youtube";
      this.id = url.substring(youtubeLinkPrefix.length);
    } else if (url.startsWith(vimeoLinkPrefix)) {
      this.type = "vimeo";
      this.id = url.substring(vimeoLinkPrefix.length);
    } else {
      this.type = "invalid";
      this.id = "";
    }

    this.description = description;
  }

  isValid() {
    return this.type !== "invalid";
  }

  getVideoUrl() {
    switch (this.type) {
      case "youtube":
        return `https://www.youtube.com/watch?v=${this.id}`;

      case "vimeo":
        return `https://vimeo.com/${this.id}`;

      case "invalid":
        return "";
    }
  }

  getThumbnailUrl() {
    switch (this.type) {
      case "youtube":
        return `https://i.ytimg.com/vi_webp/${this.id}/maxresdefault.webp`;

      case "vimeo":
        return `https://vumbnail.com/${this.id}.jpg`;

      case "invalid":
        return "";
    }
  }

  getThumbnailAspectRatio() {
    switch (this.type) {
      case "youtube":
        return "4_3";

      case "vimeo":
        return "16_9";

      case "invalid":
        return "";
    }
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
const videoLibraryParentDiv = document.querySelector<HTMLDivElement>("#video-library-fancybox");

if (videoLibraryParentDiv) {
  // Retrieve video links from inner <a> elements
  const videoLinkElements = Array.from(
    videoLibraryParentDiv.querySelectorAll<HTMLAnchorElement>("a")
  );

  const videoDescriptors = videoLinkElements
    .map(
      (videoLinkElement) => new VideoDescriptor(videoLinkElement.href, videoLinkElement.innerText)
    )
    .filter((v) => v.isValid());

  // Remove "Loading..." etc. content
  videoLibraryParentDiv.innerHTML = "";

  // Populate videos
  videoDescriptors.forEach((videoDescriptor, index) => {
    // Generate description div
    const descriptionElement = document.createElement("span");

    descriptionElement.classList.add("video-library-description");
    descriptionElement.appendChild(document.createTextNode(videoDescriptor.description));

    // Generate play button SVG
    const playButtonElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    playButtonElement.classList.add("video-library-play-button");
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

    imageElement.classList.add("video-library-preview");
    imageElement.src = videoDescriptor.getThumbnailUrl();

    // Generate outer div
    const outerDivElement = document.createElement("div");

    outerDivElement.classList.add("video-library-float");

    outerDivElement.addEventListener("click", () => {
      showCarouselForVideo(videoDescriptors, index);
    });

    // Insert img and svg into outer div
    outerDivElement.appendChild(descriptionElement);
    outerDivElement.appendChild(playButtonElement);
    outerDivElement.appendChild(imageElement);

    // Insert outer div into parent div
    videoLibraryParentDiv.appendChild(outerDivElement);
  });
}
