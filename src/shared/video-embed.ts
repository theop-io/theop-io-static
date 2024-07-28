import {
  createElementWithChildren,
  createElementWithInitializerAndChildren,
} from "./display-tools";

import { VideoService } from "./video-embed-types";

export function displayEmbeddedVideo(videoRef: string): HTMLElement {
  const [videoService, videoId] = videoRef.split(":");

  if (videoService === VideoService.YouTube) {
    return createElementWithInitializerAndChildren(
      "div",
      (element) => element.classList.add("theop_video_container"),
      createElementWithInitializerAndChildren("iframe", (element) => {
        element.src = `https://www.youtube.com/embed/${videoId}`;
        element.allow = "encrypted-media";
        element.allowFullscreen = true;
      })
    );
  } else if (videoService === VideoService.Vimeo) {
    return createElementWithInitializerAndChildren(
      "div",
      (element) => element.classList.add("theop_video_container"),
      createElementWithInitializerAndChildren("iframe", (element) => {
        element.src = `https://player.vimeo.com/video/${videoId}`;
        element.allow = "encrypted-media";
        element.allowFullscreen = true;
      })
    );
  } else {
    return createElementWithChildren("div");
  }
}
