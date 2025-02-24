import React, { memo, useCallback } from "react";
import { FlatList, ListRenderItemInfo, StyleSheet, View } from "react-native";
import { DetectedAudioSegment } from "../../types";
import useLayout from "../data/useLayout";
import AudioRowSmall from "./AudioRowSmall";

interface AudioListSmallProps {
  detections: DetectedAudioSegment[];
}

function AudioListSmall(props: AudioListSmallProps) {
  let detections = props.detections;
  let [size, onLayout] = useLayout();
  let isSmall = size && size.width < 330;

  let renderItem = useCallback(
    (info: ListRenderItemInfo<DetectedAudioSegment>) => {
      return (
        <AudioRowSmall
          isSmall={isSmall === true}
          detection={info.item}
        ></AudioRowSmall>
      );
    },
    [isSmall]
  );

  return (
    <FlatList
      style={[styles.AudioListSmall]}
      onLayout={onLayout}
      data={detections}
      renderItem={renderItem}
      extraData={isSmall}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <Seperator isSmall={isSmall}></Seperator>}
    />
  );
}

function Seperator(props: any) {
  return (
    <View style={[styles.seperator, props.isSmall && { paddingHorizontal: 8 }]}>
      <View style={styles.seperatorInner}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  AudioListSmall: {
    flex: 1,
  },
  seperator: {
    height: 2,
    backgroundColor: "#F4F5F7",
    paddingHorizontal: 16,
  },
  seperatorInner: {
    height: 2,
    backgroundColor: "#E7EAEE",
  },
});

export default memo(AudioListSmall);
