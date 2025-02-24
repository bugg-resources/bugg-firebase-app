import React, { useCallback } from "react";
import { useAudioPlayerIsPlaying, usePlayAudioUri } from "./AudioPlayer";

interface PlayButtonProps {
  id: string;
  uri: string;
  title: string;
  date?: Date;
  site?: string;
}

function PlayButton(props: PlayButtonProps) {
  let [playingAudio, playAudio] = usePlayAudioUri();
  let isPlaying = useAudioPlayerIsPlaying();

  let { id, uri, title, date, site } = props;

  let currentlyPlayingId = playingAudio?.id;

  let toggle = useCallback(() => {
    if (currentlyPlayingId === id && isPlaying) {
      playAudio(null);
    } else {
      playAudio({ id, uri, title, date, site });
    }
  }, [playAudio, isPlaying, id, uri, title, date, site, currentlyPlayingId]);

  let isPlayingThisFile = currentlyPlayingId === id;

  return (
    <button
      type="button"
      className="relative inline-flex items-center border border-transparent rounded-full shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange"
      onClick={toggle}
    >
      {isPlayingThisFile && (
        <img width={35} height={35} src={"/bugg-pause.svg"}></img>
      )}
      {!isPlayingThisFile && (
        <img width={35} height={35} src={"/bugg-play.svg"}></img>
      )}
    </button>
  );
}

export default PlayButton;
