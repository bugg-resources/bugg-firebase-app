import { Link } from "@react-navigation/native";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

interface SegmentedControlProps {
  children: any;
}

function SegmentedControl(props: SegmentedControlProps) {
  return <View style={styles.SegmentedControl}>{props.children}</View>;
}

interface SegmentedControlSegmentProps {
  link: string;
  first?: boolean;
  active?: boolean;
  children?: any;
}

export function SegmentedControlSegment(props: SegmentedControlSegmentProps) {
  return (
    <Link
      to={props.link}
      style={[
        styles.SegmentedControlSegment,
        props.active && styles.segmentActive,
        props.first && styles.segmentFirst,
      ]}
    >
      {props.children}
    </Link>
  );
}

const styles = StyleSheet.create({
  SegmentedControl: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#BDCBD4",
    borderRadius: 8,
    overflow: "hidden",
    height: 38,
  },
  SegmentedControlSegment: {
    height: 38,
    width: 38,

    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    borderLeftStyle: "solid",
    borderLeftWidth: 1,
    borderLeftColor: "#BDCBD4",
  },
  segmentActive: {
    backgroundColor: "#EFF0F4",
  },
  segmentFirst: {
    borderLeftWidth: 0,
  },
});

export default memo(SegmentedControl);
