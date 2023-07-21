import YouTubePlayerFactory from "youtube-player";

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
