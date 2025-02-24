import { Audio, AVPlaybackStatus } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import firebase from "firebase/app";
import React, { memo, useCallback, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { PlayIcon, StopIcon } from "./Icons";

interface PlayButtonProps {
  audioUrl: string;
  // secs in the audio to start from
  start?: number;
  end?: number;
}

function PlayButton(props: PlayButtonProps) {
  let [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = React.useState(null as null | Sound);
  const [progressPercent, setProgressPercent] = React.useState(0);

  let startMillis = props.start ? props.start * 1000 : null;
  let endMillis = props.end ? props.end * 1000 : null;

  let onProgress = useCallback(
    (status: AVPlaybackStatus) => {
      if (status.isLoaded && startMillis && endMillis) {
        let percent =
          (status.positionMillis - startMillis) / (endMillis - startMillis);
        setProgressPercent(percent > 1 ? 1 : percent);
        if (status.positionMillis > endMillis) {
          setSound(null);
          setProgressPercent(0);
          setIsPlaying(false);
        }
      }
    },
    [startMillis, endMillis, setSound, setProgressPercent]
  );

  let play = useCallback(async () => {
    let ref = firebase.storage().refFromURL(props.audioUrl);
    let u = await ref.getDownloadURL();

    let params = {} as any;
    if (props.start) {
      params.positionMillis = props.start * 1000;
    }

    const { sound } = await Audio.Sound.createAsync(u, {
      ...params,
    });
    sound.setOnPlaybackStatusUpdate(onProgress);
    setSound(sound);
    setIsPlaying(true);
  }, [setIsPlaying, setSound, props.audioUrl, onProgress]);

  let pause = useCallback(() => {
    setSound(null);
    setIsPlaying(false);
  }, [setIsPlaying]);

  useEffect(() => {
    return () => {
      pause();
    };
  }, [pause]);

  useEffect(() => {
    sound?.playAsync();
    sound?.setProgressUpdateIntervalAsync(100);

    return () => {
      sound?.unloadAsync();
    };
  }, [sound, props.start, setIsPlaying, setProgressPercent]);

  let radius = 16;
  let stroke = 1.5;
  let normalizedRadius = radius - stroke * 2;
  let circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <TouchableOpacity
      style={[styles.PlayButton]}
      onPress={isPlaying ? pause : play}
    >
      <View style={styles.playInner}>
        {!isPlaying && (
          <View style={styles.playIcon}>
            <PlayIcon width={22} colour="#FFF"></PlayIcon>
          </View>
        )}
        {isPlaying && (
          <View style={styles.stopIcon}>
            <StopIcon width={18} colour="#FFF"></StopIcon>
          </View>
        )}
      </View>
      {isPlaying && (
        <Svg
          height={34}
          width={34}
          style={[
            styles.progressContainer,
            { transform: [{ rotate: `-90deg` }] },
          ]}
        >
          <Circle
            strokeWidth={stroke}
            stroke={"#2AC9BA"}
            fill={"transparent"}
            strokeDashoffset={strokeDashoffset}
            strokeDasharray={circumference + ", " + circumference}
            r={normalizedRadius}
            cx={17}
            cy={17}
          />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  PlayButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    height: 34,
    width: 34,
    borderRadius: 17,

    position: "relative",
  },
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playInner: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C1C1C1",
    height: 28,
    width: 28,
    borderRadius: 14,
  },
  playIcon: {
    marginLeft: 2,
  },
  stopIcon: {
    marginLeft: 0,
  },
});

export default memo(PlayButton);
