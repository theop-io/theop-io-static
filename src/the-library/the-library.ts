import YouTubePlayer from "youtube-player";

/*
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
*/

const player = YouTubePlayer("youtubeVideo1");
player.loadVideoById("M7lc1UVf-VE");
