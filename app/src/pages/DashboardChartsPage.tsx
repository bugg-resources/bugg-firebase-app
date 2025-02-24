import { useRoute } from "@react-navigation/core";
import React, { memo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import AnalysisCardSet from "../components/AnalysisCardSet";
import Header from "../components/Header";
import { useApplication } from "../data/useApplication";

interface DashboardChartsPageProps {}

function DashboardChartsPage(props: DashboardChartsPageProps) {
  let route = useRoute();
  let projectId = (route.params as any)?.projectId;
  useApplication(projectId);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header></Header>
        <View style={styles.cards}>
          <AnalysisCardSet></AnalysisCardSet>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFF",
    display: "flex",
    flexDirection: "column",
    flexBasis: 1,
    flexGrow: 1,
    flexShrink: 1,
    // backgroundColor: "green",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    flexGrow: 1,
    flexBasis: 1,
    flexShrink: 1,
    // backgroundColor: "blue",
  },
  cards: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    flexBasis: 1,
    flexGrow: 1,
    flexShrink: 1,
    paddingTop: 8,
    paddingBottom: 24,
    marginBottom: 24,
    marginHorizontal: 16,
    // backgroundColor: "orange",
  },
});

export default memo(DashboardChartsPage);
