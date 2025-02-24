import { Link, RouteProp, useRoute } from "@react-navigation/native";
import React, { memo } from "react";
import { StyleSheet, Text } from "react-native";
import { MainStackParamList } from "../Router";
import Hoverable from "./Hover/Hoverable";

interface TagProps {
  children?: string;
}

// The main pages have the same props, just using one as a prototype here
export type ChartsRouteProp = RouteProp<
  MainStackParamList,
  "DashboardChartsPage"
>;

function Tag(props: TagProps) {
  let route = useRoute<ChartsRouteProp>();
  let { projectId } = route.params;

  return (
    <Hoverable>
      {(hovering) => (
        <Link
          to={`/${projectId}/editor/aud_1234/${props.children}`}
          style={[styles.Tag, hovering && styles.hover]}
        >
          <Text style={styles.tagText}>{props.children}</Text>
        </Link>
      )}
    </Hoverable>
  );
}

const styles = StyleSheet.create({
  Tag: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderColor: "#D4DFE6",
    borderStyle: "solid",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 1,
    marginTop: 4,
  },
  tagText: {
    color: "#74848E",
    fontSize: 12,
  },
  hover: { backgroundColor: "#eee" },
});

export default memo(Tag);
