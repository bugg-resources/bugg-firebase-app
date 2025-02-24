import { useRoute } from "@react-navigation/core";
import { Link } from "@react-navigation/native";
import { format } from "date-fns";
import firebase from "firebase/app";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  FlatList,
  GestureResponderEvent,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ExportJob } from "../../types";
import ExportRequestForm from "../components/ExportRequestForm";
import Header from "../components/Header";
import Hoverable from "../components/Hover/Hoverable";
import { ExportIcon, PlusIcon } from "../components/Icons";

interface ExportListPageProps {}

let headings = ["STARTED", "TYPE", "FROM", "TO", "RECORDS", "STATUS"];

function ExportListPage(props: ExportListPageProps) {
  let route = useRoute();
  let { projectId, configId } = route.params as any;

  let [exportJobs, setExportJobs] = useState(null as null | ExportJob[]);

  useEffect(() => {
    let unsub = firebase
      .firestore()
      .collection(`exports`)
      .where("projectId", "==", projectId)
      .orderBy("createdAt", "desc")
      .onSnapshot((snap) => {
        let incomming = snap.docs.map((d) => d.data() as ExportJob);
        setExportJobs(incomming);
      });

    return () => {
      unsub();
    };
  }, [configId, setExportJobs]);

  let renderItem = useCallback((info: ListRenderItemInfo<ExportJob>) => {
    return <TableRow job={info.item}></TableRow>;
  }, []);

  return (
    <View style={styles.page}>
      <Header></Header>

      <View style={styles.titleBar}>
        <Text style={styles.title}>All Exports</Text>
        <View style={styles.actions}>
          <Link to={`/${projectId}/exports/_new`}>
            <View style={styles.button}>
              <PlusIcon colour={"#FFF"} width={16}></PlusIcon>
            </View>
          </Link>
        </View>
      </View>

      <View style={styles.tableContainer}>
        <View style={[styles.TableRow, styles.TableRowHeader]}>
          {headings.map((h) => (
            <View key={h} style={styles.tableRowCell}>
              <Text style={styles.tableHeaderText}>{h}</Text>
            </View>
          ))}
          <View style={styles.tableRowCell}>
            <Text style={styles.tableHeaderText}>DOWNLOAD</Text>
          </View>
        </View>
        <FlatList
          style={[styles.configList]}
          data={exportJobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Seperator></Seperator>}
        />
      </View>

      <ExportRequestForm></ExportRequestForm>
    </View>
  );
}
function Seperator(props: any) {
  return <View style={[styles.seperator]}></View>;
}

interface TableRowProps {
  job: ExportJob;
}

function TableRow(props: TableRowProps) {
  let route = useRoute();
  let { projectId } = route.params as any;

  let download = useCallback(
    async (e: GestureResponderEvent) => {
      e.preventDefault();

      if (!props.job.uri) {
        return;
      }

      console.log(props.job.uri);

      let ref = firebase.storage().refFromURL(props.job.uri);
      let link = await ref.getDownloadURL();

      console.log(link);

      //@ts-ignore
      window.open(link, "_blank").focus();
    },
    [projectId, props.job]
  );

  return (
    <Hoverable>
      {(hovering) => (
        <View style={[styles.TableRow, hovering && styles.TableRowHover]}>
          <View style={styles.tableRowCell}>
            <Text style={styles.tableRowText}>
              {props.job.beganProcessing
                ? format(props.job.beganProcessing.toDate(), "dd-MM-yyyy HH:mm")
                : ""}
            </Text>
          </View>
          <View style={styles.tableRowCell}>
            <Text style={styles.tableRowText}>{props.job.type}</Text>
          </View>

          <View style={styles.tableRowCell}>
            <Text style={styles.tableRowText}>
              {props.job.from
                ? format(props.job.from.toDate(), "dd-MM-yyyy")
                : "-"}
            </Text>
          </View>

          <View style={styles.tableRowCell}>
            <Text style={styles.tableRowText}>
              {props.job.to ? format(props.job.to.toDate(), "dd-MM-yyyy") : "-"}
            </Text>
          </View>

          <View style={styles.tableRowCell}>
            <Text style={styles.tableRowText}>
              {props.job.recordsProcessed}
            </Text>
          </View>
          <View style={styles.tableRowCell}>
            <Text style={styles.tableRowText}>{props.job.status}</Text>
          </View>

          {props.job.status === "COMPLETE" && (
            <TouchableOpacity
              style={[styles.tableRowCell, { justifyContent: "center" }]}
              onPress={download}
            >
              <ExportIcon width={22} colour="#696974"></ExportIcon>
            </TouchableOpacity>
          )}

          {props.job.status !== "COMPLETE" && (
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}></Text>
            </View>
          )}
        </View>
      )}
    </Hoverable>
  );
}

const styles = StyleSheet.create({
  page: {
    position: "relative",
    backgroundColor: "#F6F6F9",
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
  titleBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    color: "#283946",
    fontSize: 22,
  },
  actions: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "#64C4B8",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    width: 52,
    paddingVertical: 8,
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  TableRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  TableRowHover: {
    backgroundColor: "#F6F6F9",
  },
  TableRowSelected: {
    backgroundColor: "#F6F6F6",
  },
  TableRowHeader: {
    borderBottomColor: "#F6F6F9",
    borderBottomWidth: 1,
    borderStyle: "solid",
    paddingTop: 8,
  },
  tableHeaderText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#B5B5BE",
    letterSpacing: 0.1,
  },
  tableRowCell: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tableRowText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#696974",
  },
  seperator: {
    height: 2,
    backgroundColor: "#F4F5F7",
    paddingHorizontal: 16,
  },

  tableContainer: {
    flexGrow: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderStyle: "solid",
    borderColor: "#FFF",
    borderWidth: 1,
  },
  configList: {},
});

export default memo(ExportListPage);
