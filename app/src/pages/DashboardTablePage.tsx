import { useRoute } from "@react-navigation/core";
import format from "date-fns/format";
import React, { memo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useRecoilValue } from "recoil";
import Header from "../components/Header";
import PlayButton from "../components/PlayButton";
import Tag from "../components/Tag";
import {
  filteredDetectedSegmentsAtom,
  useApplication,
} from "../data/useApplication";

interface DashboardTablePageProps {}

// FlatList Header Row
const colTitles = ["", "Date", "Site", "Tags", ""];
const colWidths = ["10%", "14%", "18%", "46%", "12%", "25%"];
const flatListHeader = () => {
  return (
    <View style={styles.flatListHeader}>
      {colTitles.map((col, index) => {
        return (
          <TouchableOpacity
            key={index}
            style={[styles.flatListHeaderColumn, { width: colWidths[index] }]}
          >
            <Text style={styles.columnHeaderTxt}>{col}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const itemSeparator = () => <View style={styles.separator} />;

function DashboardTablePage(props: DashboardTablePageProps) {
  //Receive AudioRecords data and transform into a new transformedAudioRecord for each detection in the AudioRecord
  // @todo audioRecords interface not being accepted for some reason, so it's not currently typed??

  let route = useRoute();
  let projectId = (route.params as any)?.projectId;
  useApplication(projectId);

  let dims = useWindowDimensions();

  let detections = useRecoilValue(filteredDetectedSegmentsAtom);

  return (
    <View style={[styles.page, { height: dims.height }]}>
      <Header></Header>
      <View style={styles.container}>
        <FlatList
          style={styles.list}
          data={detections}
          keyExtractor={(item, index) => item.id}
          ItemSeparatorComponent={itemSeparator}
          ListHeaderComponent={flatListHeader}
          stickyHeaderIndices={[0]}
          renderItem={({ item, index, separators }) => (
            // @todo top row has too big a top-margin but it's caused by FlatList's header
            <TouchableHighlight
              onShowUnderlay={separators.highlight}
              onHideUnderlay={separators.unhighlight}
            >
              <View style={styles.rowFlatList}>
                <View style={styles.columnPlayButton}>
                  <PlayButton
                    audioUrl={item.audioUrl}
                    start={item.start}
                    end={item.end}
                  />
                </View>
                <View style={styles.columnDate}>
                  <Text style={styles.columnDateTxt}>
                    {format(item.createdAt.toDate(), "dd-MM-yy hh:mm")}
                  </Text>
                </View>
                <View style={styles.columnBuggId}>
                  <Text style={styles.columnBuggIdTxt}>
                    {item.siteName || item.recorder}
                  </Text>
                </View>
                <View style={styles.columnTags}>
                  <View style={styles.columnTagsTxt}>
                    {item.tags.map((tag: any, i: number) => (
                      <Tag>{tag}</Tag>
                    ))}
                  </View>
                </View>
                {/*@todo replace + sign with pen icon*/}
                <View style={styles.columnAddTag}>
                  {/* <Text>
                    <Text style={styles.addTag}>
                      <Text
                        style={{
                          color: "#30c8ba",
                          fontWeight: "bold",
                          marginRight: 10,
                        }}
                      >
                        +
                      </Text>
                      <Text style={styles.addTagTxt}>Tag</Text>
                    </Text>
                  </Text> */}
                </View>
              </View>
            </TouchableHighlight>
          )}
        />
      </View>
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
  },

  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "stretch",
    flexBasis: 1,
    flexShrink: 1,
    flexGrow: 1,
  },
  list: {},
  separator: {
    height: 1,
    width: "100%",
    backgroundColor: "#D4DFE6",
  },
  flatListHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    borderTop: "1px solid black",
    borderBottom: "1px solid black",
    backgroundColor: "#FFF",
  },
  flatListHeaderColumn: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D4DFE6",
    borderTopWidth: 1,
    borderTopColor: "#D4DFE6",
  },
  columnHeaderTxt: {
    color: "#74848E",
    fontWeight: "bold",
  },
  rowFlatList: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  columnPlayButton: {
    width: "10%",
    alignItems: "center",
  },
  columnDate: {
    width: "14%",
  },
  columnDateTxt: {
    color: "#74848E",
  },
  columnBuggId: {
    width: "18%",
  },
  columnBuggIdTxt: {
    color: "#74848E",
  },
  columnTags: {
    width: "46%",
  },
  columnTagsTxt: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 3,
  },
  columnAddTag: {
    width: "12%",
  },
  addTag: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderColor: "#D4DFE6",
    borderStyle: "solid",
    borderWidth: 1,
    paddingVertical: 4,
    marginRight: 1,
    marginVertical: 4,
  },
  addTagTxt: {
    color: "#74848E",
    fontSize: 12,
  },
});

export default memo(DashboardTablePage);
