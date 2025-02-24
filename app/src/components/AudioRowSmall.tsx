import moment from "moment";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DetectedAudioSegment } from "../../types";
import PlayButton from "./PlayButton";
import Tag from "./Tag";

interface AudioRowSmallProps {
  // on smaller mobile width
  isSmall: boolean;

  detection: DetectedAudioSegment;
}

function AudioRowSmall(props: AudioRowSmallProps) {
  let detection = props.detection;

  let dateTime = moment(detection.createdAt.toDate()).format(
    "DD-MM-YYYY hh:mm"
  );
  return (
    <View
      style={[styles.AudioRowSmall, props.isSmall && { paddingHorizontal: 8 }]}
    >
      <View style={styles.playButtonContainer}>
        <PlayButton
          audioUrl={detection.audioUrl}
          start={detection.start}
          end={detection.end}
        ></PlayButton>
      </View>
      <View style={styles.detailContainer}>
        <Text style={styles.detailTime}>{dateTime}</Text>
        <Text style={styles.detailId}>{detection.siteName}</Text>
      </View>
      <View style={styles.tagsContainer}>
        {detection.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  AudioRowSmall: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#F4F5F7",
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  playButtonContainer: {},
  detailContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingHorizontal: 8,
  },
  tagsContainer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  detailTime: {
    color: "#74848E",
    fontSize: 9,
    marginTop: 4,
  },
  detailId: {
    color: "#74848E",
    fontWeight: "bold",
    fontSize: 9,
    marginTop: 3,
  },
});

export default memo(AudioRowSmall);
