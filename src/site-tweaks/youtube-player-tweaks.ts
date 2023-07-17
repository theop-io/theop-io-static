//
// Site tweak: YouTube tweaks
// - Pause video when a different video is started
//

//
// State
//

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

function onYouTubeIframeAPIReady() {
  // Find all <iframe> instances pointing to YouTube
  const youtubeIframes = document.querySelectorAll<HTMLIFrameElement>(
    'iframe[src^="https://www.youtube.com"]'
  );

  youtubeIframes.forEach((iFrame) => {
    // Fix up <iframe> target: enable JavaScript API
    iFrame.src += "&enablejsapi=1";

    // Construct YouTube player object so we can attach a state change callback
    const playerObject = new YT.Player(iFrame, {
      events: {
        onStateChange: onYouTubePlayerStateChange,
      },
    });

    console.log(playerObject);
  });
}
