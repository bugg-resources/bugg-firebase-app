import { useRoute } from "@react-navigation/core";
import React, { memo } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useRecoilValue } from "recoil";
import AnalysisCardSet from "../components/AnalysisCardSet";
import Header from "../components/Header";
import Map from "../components/Map";
import { allRecordersAtom, useApplication } from "../data/useApplication";

interface DashboardMapPageProps {}

function DashboardMapPage(props: DashboardMapPageProps) {
  let route = useRoute();
  let projectId = (route.params as any)?.projectId;
  useApplication(projectId);

  let dims = useWindowDimensions();

  let recorders = useRecoilValue(allRecordersAtom);

  return (
    <View style={styles.page}>
      <ScrollView
        style={[styles.charts, { height: dims.height }]}
        contentContainerStyle={styles.container}
      >
        <Header small={true}></Header>
        <View style={styles.cards}>
          <AnalysisCardSet></AnalysisCardSet>
        </View>
      </ScrollView>
      <View style={styles.map}>{recorders.length > 0 && <Map></Map>}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFF",
    flex: 1,
    flexDirection: "row",
  },
  map: {
    flexGrow: 1,
    overflow: "hidden",
    zIndex: 1,
  },
  charts: {
    width: 411,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 411,
    zIndex: 10,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  cards: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    flex: 1,
    paddingTop: 8,
    paddingBottom: 24,
  },
});

export default memo(DashboardMapPage);
