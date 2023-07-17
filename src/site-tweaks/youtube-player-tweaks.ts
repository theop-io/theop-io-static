//
// Site tweak: YouTube tweaks
// - Pause video when a different video is started
//

//
// State
//

let initializedYoutubeTweaks = false;
let activeYoutubePlayer: YT.Player | undefined = undefined;

//
// Callbacks
//

function onYouTubePlayerStateChange(event: YT.OnStateChangeEvent) {
  switch (event.data) {
    case YT.PlayerState.PLAYING:
      // Pause other player
      if (activeYoutubePlayer) {
        activeYoutubePlayer.pauseVideo();
      }

      // Commit state
      activeYoutubePlayer = event.target;
      break;

    case YT.PlayerState.PAUSED:
    case YT.PlayerState.ENDED:
      if (activeYoutubePlayer === event.target) {
        // Remove state
        activeYoutubePlayer = undefined;
      } else {
        // Must have pointed `activeYoutubePlayer` to a different player instance previously -> leave as-is
      }
  }
}

function getYoutubeIframes() {
  return document.querySelectorAll<HTMLIFrameElement>('iframe[src^="https://www.youtube.com"]');
}

function onYouTubeIframeAPIReady() {
  if (initializedYoutubeTweaks) {
    return;
  }

  initializedYoutubeTweaks = true;

  // Find all <iframe> instances pointing to YouTube
  getYoutubeIframes().forEach((iFrame) => {
    // Construct YouTube player object so we can attach a state change callback
    const playerObject = new YT.Player(iFrame, {
      events: {
        onStateChange: onYouTubePlayerStateChange,
      },
    });

    console.log(playerObject);
  });
}

//
// Initialization
//

// - Find all <iframe> instances pointing to YouTube
getYoutubeIframes().forEach((iFrame) => {
  // Fix up <iframe> target: enable JavaScript API
  iFrame.src += "&enablejsapi=1";

  console.log(`Fixed player frame ${iFrame.src}`);
});

// - We _actually_ want to wait for the YouTube API code to call us, but the following is necessary
//   to keep this code from getting reaped by webpack tree shaking.
//   There's probably a more intelligent way of doing this but the following seems benign and works.
if (typeof YT !== "undefined") {
  onYouTubeIframeAPIReady();
}
