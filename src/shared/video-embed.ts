import {
  createElementWithChildren,
  createElementWithInitializerAndChildren,
} from "./display-tools";

import { VideoService } from "./video-embed-types";

function videoUrlFromVideoServiceAndId(videoService: VideoService, videoId: string) {
  switch (videoService) {
    case VideoService.YouTube:
      return `https://www.youtube.com/embed/${videoId}`;

    case VideoService.Vimeo:
      return `https://player.vimeo.com/video/${videoId}`;

    default:
      return undefined;
  }
}

export function displayEmbeddedVideo(videoRef: string): HTMLElement {
  const [videoService, aspectRatioClass, videoId] = videoRef.split(":");

  const videoUrl = videoUrlFromVideoServiceAndId(videoService as VideoService, videoId);

  if (!videoUrl) {
    return createElementWithChildren("div");
  }

  return createElementWithInitializerAndChildren(
    "div",
    (element) => element.classList.add(`theop_video_container`, `theop_video_${aspectRatioClass}`),
    createElementWithInitializerAndChildren("iframe", (element) => {
      element.src = videoUrl;
      element.allow = "encrypted-media";
      element.allowFullscreen = true;
    })
  );
}
