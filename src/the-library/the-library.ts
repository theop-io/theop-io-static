import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

// Types
class VideoDescriptor {
  readonly type: "youtube" | "vimeo" | "invalid";
  readonly id: string;
  readonly description: string;

  private static typeAndIdFromURL(url: URL): {
    type: VideoDescriptor["type"];
    id: VideoDescriptor["id"];
  } {
    function idFromFrontOfPath() {
      // RegEx to capture the first alpha-numeric range after a leading forward slash
      const alphaNumericalIdFromPathRegEx = /^\/(\w+)/;

      const idMatches = alphaNumericalIdFromPathRegEx.exec(url.pathname);

      if (idMatches && idMatches.length > 1) {
        // Return the first capture group, i.e. the actual video ID
        // - index 0 == the entire matching text
        // - index 1 == the capture group
        return idMatches[1];
      }

      return null;
    }

    // e.g. https://youtu.be/jubc9USjbdg
    if (url.hostname === "youtu.be") {
      const id = idFromFrontOfPath();

      if (id) {
        return { type: "youtube", id };
      }
    }

    // e.g. https://www.youtube.com/watch?v=yeHrGgUA1q8&t=1s&ab_channel=GrumpycorpStudios
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/watch")) {
        const id = url.searchParams.get("v");

        if (id) {
          return { type: "youtube", id };
        }
      }
    }

    // e.g. https://vimeo.com/266134889
    if (url.hostname === "vimeo.com") {
      const id = idFromFrontOfPath();

      if (id) {
        return { type: "vimeo", id };
      }
    }

    return { type: "invalid", id: "" };
  }

  constructor(url: URL, description: string) {
    const typeAndId = VideoDescriptor.typeAndIdFromURL(url);

    this.type = typeAndId.type;
    this.id = typeAndId.id;
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

// Show carousel on click
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
const videoLibraryParentDivs = document.querySelectorAll<HTMLDivElement>(".video-library");

videoLibraryParentDivs.forEach((videoLibraryParentDiv) => {
  // Retrieve video links from inner <a> elements
  const videoLinkElements = Array.from(
    videoLibraryParentDiv.querySelectorAll<HTMLAnchorElement>("a")
  );

  const videoDescriptors = videoLinkElements
    .map(
      (videoLinkElement) =>
        new VideoDescriptor(new URL(videoLinkElement.href), videoLinkElement.innerText)
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
});
