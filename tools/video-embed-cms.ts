import { VideoService } from "../src/shared/video-embed-types";

export function videoRefFromVideoLink(
  videoLink?: string,
  videoAspectRatio?: string
): string | undefined {
  if (!videoLink) {
    return undefined;
  }

  function linkForServiceAndId(videoService: VideoService, videoId: string | null | undefined) {
    const defaultAspectRatio = "16:9";

    const aspectRatioClass = (videoAspectRatio ?? defaultAspectRatio)
      .replace(/\./g, "") // "2.39:1" -> "239:1"
      .replace(":", ""); // "239:1" -> "2391"

    return videoId ? `${videoService}:${aspectRatioClass}:${videoId}` : undefined;
  }

  const videoUrl = new URL(videoLink);

  if (videoUrl.hostname.endsWith("youtube.com")) {
    if (videoUrl.pathname === "/watch") {
      // e.g. https://www.youtube.com/watch?v=M1mg0yLDzvU&list=RDzfpSn7ZYC0A&index=25&ab_channel=NPRMusic
      return linkForServiceAndId(VideoService.YouTube, videoUrl.searchParams.get("v"));
    } else if (videoUrl.pathname.startsWith("/embed/")) {
      // e.g. https://www.youtube.com/embed/aTnm4vSUxL8?wmode=opaque
      return linkForServiceAndId(
        VideoService.YouTube,
        videoUrl.pathname.substring("/embed/".length)
      );
    }
  } else if (videoUrl.hostname === "youtu.be") {
    // e.g. https://youtu.be/M1mg0yLDzvU?si=9aihZTVI0vNp_T-F
    return linkForServiceAndId(VideoService.YouTube, videoUrl.pathname.replace(/^\//, ""));
  } else if (videoUrl.hostname === "vimeo.com") {
    // e.g. https://vimeo.com/950425850?share=copy
    return linkForServiceAndId(VideoService.Vimeo, videoUrl.pathname.replace(/^\//, ""));
  }

  return undefined;
}
