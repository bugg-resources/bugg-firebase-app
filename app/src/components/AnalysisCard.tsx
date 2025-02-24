import React, { memo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useRecoilValue } from "recoil";
import { Analysis } from "../../types";
import {
  filteredDetectedSegmentsByAnalysisAtom,
  percentageHitsByAnalysisAtom,
} from "../data/useApplication";
import AudioListSmall from "./AudioListSmall";
import BuggAreaChart from "./BuggAreaChart";
import { AnomalyIcon } from "./Icons";

interface AnalysisCardProps {
  analysis: Analysis;
}

function AnalysisCard(props: AnalysisCardProps) {
  // Ideally the card is about 380 wide but on the
  let windowW = Dimensions.get("window").width;
  // let it fill the screen on mobile, but try and fit more in on desktop

  let maxWidth = windowW - 16;
  if (windowW > 412) {
    // two across on an iPad
    maxWidth = 367;
  }

  let extraStyles = { maxWidth } as any;
  let detections = useRecoilValue(
    filteredDetectedSegmentsByAnalysisAtom(props.analysis.id)
  );

  let percentage = useRecoilValue(
    percentageHitsByAnalysisAtom(props.analysis.id)
  );

  if (detections.length === 0) {
    return null;
  }

  return (
    <View style={[styles.AnalysisCard, extraStyles]}>
      <View style={styles.top}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: props.analysis.colourSecondary },
            ]}
          >
            <AnomalyIcon
              width={22}
              colour={props.analysis.colourPrimary}
            ></AnomalyIcon>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{props.analysis.displayName}</Text>
            <Text style={styles.indicator}>{percentage}%</Text>
          </View>
          <View style={styles.countContainer}>
            <Text style={styles.count}>{detections.length}</Text>
          </View>
        </View>
        <BuggAreaChart
          detections={detections}
          primaryColour={props.analysis.colourPrimary}
          secondaryColour={props.analysis.colourSecondary}
        ></BuggAreaChart>
      </View>

      <View style={styles.bottom}>
        <AudioListSmall detections={detections}></AudioListSmall>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  AnalysisCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 411,
    minWidth: 304,

    borderColor: "#E8ECEE",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 15,

    marginHorizontal: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  top: {},
  header: {
    padding: 16,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  bottom: {
    borderColor: "#E8ECEE",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    width: "100%",
    height: 175,
    display: "flex",
    flexDirection: "column",
  },
  iconContainer: {
    width: 35,
    height: 35,
    backgroundColor: "#E4F4F3",
    borderRadius: 8,
    marginRight: 10,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexGrow: 1,
  },
  title: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  indicator: {
    color: "#00C69C",
    fontWeight: "bold",
    fontSize: 14,
  },
  countContainer: {},
  count: {
    color: "#000",
    fontSize: 52,
    lineHeight: 37,
    fontWeight: "bold",
  },
});

export default memo(AnalysisCard);
