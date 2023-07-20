import YouTubePlayerFactory from "youtube-player";

import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

//
// State
//

let activeYoutubePlayer: YT.Player | undefined = undefined;

//
// Callbacks
//

function onYouTubePlayerStateChange(poorlyTypedEvent: CustomEvent & { data: number }) {
  // Fix up somewhat shoddy typing in `youtube-player` package
  const event = poorlyTypedEvent as unknown as YT.OnStateChangeEvent;

  switch (event.data) {
    case YT.PlayerState.PLAYING:
      {
        //
        // Play only one video at a time
        //

        // Pause other player
        if (activeYoutubePlayer) {
          activeYoutubePlayer.pauseVideo();
        }

        // Commit state
        activeYoutubePlayer = event.target;
      }

      {
        //
        // Expand playing video to larger size
        //

        event.target.getIframe().parentElement?.classList.add("youtube-library-float-active");
      }
      break;

    case YT.PlayerState.PAUSED:
    case YT.PlayerState.ENDED:
      {
        //
        // Play only one video at a time
        //

        if (activeYoutubePlayer === event.target) {
          // Remove state
          activeYoutubePlayer = undefined;
        } else {
          // Must have pointed `activeYoutubePlayer` to a different player instance previously -> leave as-is
        }
      }

      {
        //
        // Revert paused video to regular size
        //

        event.target.getIframe().parentElement?.classList.remove("youtube-library-float-active");
      }
  }
}

//
// Initialization
//

{
  const youtubeLibraryParentDiv = document.querySelector<HTMLDivElement>("#youtube-library");
  const youtubePlayers = new Array<ReturnType<typeof YouTubePlayerFactory>>();

  if (youtubeLibraryParentDiv) {
    const youtubeVideoLinks =
      youtubeLibraryParentDiv.getAttribute("data-video-ids")?.split(" ") ?? [];

    // Remove "Loading..." etc. content
    youtubeLibraryParentDiv.innerHTML = "";

    // Populate videos
    youtubeVideoLinks.forEach((youtubeVideoLink, index) => {
      // Strip `https://youtu.be/` prefix
      const youtubeLinkPrefix = "https://youtu.be/";

      if (!youtubeVideoLink.startsWith(youtubeLinkPrefix)) {
        return;
      }

      const youtubeVideoId = youtubeVideoLink.substring(youtubeLinkPrefix.length);

      // Generate iframe
      const iframeElement = document.createElement("iframe");

      iframeElement.id = `youtubeIframe${index}`;
      iframeElement.classList.add("youtube-library-player");
      iframeElement.allow = "fullscreen";
      iframeElement.src = `https://www.youtube.com/embed/${youtubeVideoId}/?enablejsapi=1`;

      // Generate outer div
      const outerDivElement = document.createElement("div");

      outerDivElement.classList.add("youtube-library-float");

      // Insert iframe into outer div
      outerDivElement.appendChild(iframeElement);

      // Insert outer div into parent div
      youtubeLibraryParentDiv.appendChild(outerDivElement);

      // Create Player instance
      const youtubePlayer = YouTubePlayerFactory(iframeElement.id);
      youtubePlayer.on("stateChange", onYouTubePlayerStateChange);

      youtubePlayers.push(youtubePlayer);
    });
  }
}

//
// FancyBox-based implementation
//

// URL builder helpers
function youtubeVideoUrlFromVideoId(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function youtubeThumbnailUrlFromVideoId(videoId: string) {
  return `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

// Build carousel list
function showCarouselForVideo(youtubeVideoIds: string[], videoIndex: number) {
  const carouselVideoList = youtubeVideoIds.map((videoId) => {
    return {
      src: youtubeVideoUrlFromVideoId(videoId),
      thumb: youtubeThumbnailUrlFromVideoId(videoId),
    };
  });

  Fancybox.show(carouselVideoList, {
    startIndex: videoIndex,
  });
}

const youtubeLibraryParentDiv = document.querySelector<HTMLDivElement>("#youtube-library-fancybox");

if (youtubeLibraryParentDiv) {
  // Retrieve video links from `data` attribute
  const youtubeVideoLinks =
    youtubeLibraryParentDiv.getAttribute("data-video-ids")?.split(" ") ?? [];

  // Strip prefixes
  const youtubeVideoIds = youtubeVideoLinks
    .map((youtubeVideoLink) => {
      // Strip `https://youtu.be/` prefix
      const youtubeLinkPrefix = "https://youtu.be/";

      if (!youtubeVideoLink.startsWith(youtubeLinkPrefix)) {
        return null;
      }

      return youtubeVideoLink.substring(youtubeLinkPrefix.length);
    })
    .filter((videoId): videoId is string => videoId != null);

  // Remove "Loading..." etc. content
  youtubeLibraryParentDiv.innerHTML = "";

  // Populate videos
  youtubeVideoIds.forEach((videoId, index) => {
    // Generate preview image
    const imageElement = document.createElement("img");

    imageElement.id = `youtubeImage${index}`;
    imageElement.classList.add("youtube-library-preview");
    imageElement.src = youtubeThumbnailUrlFromVideoId(videoId);

    imageElement.addEventListener("click", () => {
      showCarouselForVideo(youtubeVideoIds, index);
    });

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

    // Generate outer div
    const outerDivElement = document.createElement("div");

    outerDivElement.classList.add("youtube-library-float");

    // Insert img and svg into outer div
    outerDivElement.appendChild(imageElement);
    outerDivElement.appendChild(playButtonElement);

    // Insert outer div into parent div
    youtubeLibraryParentDiv.appendChild(outerDivElement);
  });
}
