import { Howl } from "howler";
import React, { useCallback, useEffect, useState } from "react";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { toAudioUrl } from "../data/audioUtil";

// Needs to be positioned bottom right for large screens. Can remove on mobile or go full width if it works.

// Ensure that only one audio file plays at once
let audioPlayerAtom = atom({
  key: "audioPlayerAtom",
  default: null as null | {
    id: string;
    uri: string;
    title: string;
    date?: Date;
    site?: string;
  },
});

let audioPlayerIsPlayingAtom = atom({
  key: "audioPlayerIsPlayingAtom",
  default: false,
});

export function useAudioPlayerIsPlaying() {
  return useRecoilValue(audioPlayerIsPlayingAtom);
}

export function usePlayAudioUri() {
  return useRecoilState(audioPlayerAtom);
}

export default function AudioPlayer() {
  let [audioInfo] = useRecoilState(audioPlayerAtom);
  let [audio, setAudio] = useState(null as null | Howl);

  let [isPlaying, setIsPlaying] = useRecoilState(audioPlayerIsPlayingAtom);
  let [duration, setDuration] = useState(null as null | number);

  useEffect(() => {
    if (!audioInfo) {
      return;
    }

    let sound = null as null | Howl;
    toAudioUrl(audioInfo.uri).then((url) => {
      sound = new Howl({
        src: [url],
        html5: true,
      });

      sound.play();
      setAudio(sound);

      sound.on("play", () => setIsPlaying(true));
      sound.on("stop", () => setIsPlaying(false));
      sound.on("end", () => setIsPlaying(false));
      sound.once("load", () => setDuration(sound?.duration() || null));
    });

    return () => {
      sound?.off("play", () => setIsPlaying(true));
      sound?.off("stop", () => setIsPlaying(false));
      sound?.stop();
      sound?.unload();
      sound = null;
      setAudio(null);
      setDuration(null);
      setIsPlaying(false);
    };
  }, [audioInfo, setAudio, setDuration, setIsPlaying]);

  let toggle = useCallback(() => {
    if (audio?.playing()) {
      audio.stop();
    } else {
      audio?.play();
    }
  }, [audio]);

  if (!audioInfo) {
    return null;
  }

  return (
    <div className="hidden sm:block absolute bottom-10 right-10 rounded-full overflow-hidden shadow-2xl w-64">
      <div className="col-span-1 divide-y bg-[#FE3C1A]">
        <div className="w-full flex items-center justify-between px-2 py-2 space-x-4">
          <button
            type="button"
            className="select-none border-4 border-[#A42A13] rounded-full"
            onClick={toggle}
          >
            {isPlaying && (
              <img
                className="w-10 h-10 rounded-full flex-shrink-0"
                src={"/bugg-pause2.svg"}
                alt=""
              />
            )}
            {!isPlaying && (
              <img
                className="w-10 h-10 rounded-full flex-shrink-0"
                src={"/bugg-play2.svg"}
                alt=""
              />
            )}
          </button>
          <div className="flex-1 truncate">
            <div className="flex items-center space-x-3">
              <h3 className="text-white text-sm font-medium truncate">
                {audioInfo.title}
              </h3>
            </div>
            {/* {audioInfo.date && (
              <p className="mt-0 text-gray-400 text-xs truncate">
                {format(audioInfo.date, "HH:mm, do MMM yyyy")}
              </p>
            )} */}
            {/* <p className="mt-0 text-gray-400 text-xs truncate">
              {audioInfo.site}
            </p> */}

            <p className="mt-0  text-xs truncate text-[#F19285]">
              {duration ? `${duration} sec${duration === 1 ? "" : "s"}` : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
