import { useRoute } from "@react-navigation/core";
import { Link } from "@react-navigation/native";
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
import { RecorderConfig } from "../../types";
import ConfigEditor from "../components/ConfigEditor";
import Header from "../components/Header";
import Hoverable from "../components/Hover/Hoverable";
import { ExportIcon, PlusIcon } from "../components/Icons";
import { downloadConfig } from "../data/configUtil";

interface ConfigurationPageProps {}

let headings = [
  "CONFIG I.D.",
  "APN",
  "COMPRESSION",
  "FREQUENCY",
  "RECORDING LENGTH",
  "RECORDING INTERVAL",
  "AWAKE FOR",
  "RECORDING",
  "DAILY DATA",
  "DEPLOYMENTS",
];

function ConfigurationPage(props: ConfigurationPageProps) {
  let route = useRoute();
  let { projectId, configId } = route.params as any;

  let [configs, setConfigs] = useState(null as null | RecorderConfig[]);

  useEffect(() => {
    let unsub = firebase
      .firestore()
      .collection(`config`)
      .where("projectId", "==", projectId)
      .orderBy("createdAt", "desc")
      .onSnapshot((snap) => {
        let incomming = snap.docs.map((d) => d.data() as RecorderConfig);
        setConfigs(incomming);
      });

    return () => {
      unsub();
    };
  }, [configId, setConfigs]);

  let renderItem = useCallback((info: ListRenderItemInfo<RecorderConfig>) => {
    return <TableRow config={info.item}></TableRow>;
  }, []);

  return (
    <View style={styles.page}>
      <Header></Header>

      <View style={styles.titleBar}>
        <Text style={styles.title}>Configurations</Text>
        <View style={styles.actions}>
          <Link to={`/${projectId}/config/_new`}>
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
          data={configs}
          renderItem={renderItem}
          keyExtractor={(item) => item.configId}
          ItemSeparatorComponent={() => <Seperator></Seperator>}
        />
      </View>

      {configs && <ConfigEditor allConfigs={configs}></ConfigEditor>}
    </View>
  );
}
function Seperator(props: any) {
  return <View style={[styles.seperator]}></View>;
}

interface TableRowProps {
  config: RecorderConfig;
}

function TableRow(props: TableRowProps) {
  let route = useRoute();
  let { projectId, configId } = route.params as any;

  let selected = configId === props.config.configId;

  let download = useCallback(
    (e: GestureResponderEvent) => {
      e.preventDefault();
      downloadConfig(projectId, props.config);
    },
    [projectId, props.config]
  );

  let hoursAwake = props.config.sensor.awake_times.length;
  let recordingTime = `${hoursAwake}`;
  let recordingSeconds = hoursAwake * 60 * 60;

  let l = props.config.sensor.record_length;
  let d = props.config.sensor.capture_delay;
  let t = Math.round((l / (d + l)) * hoursAwake);
  if (!isNaN(t)) {
    recordingTime = `${t}`;
    recordingSeconds = t * 60 * 60;
  }

  let bitrate = 120;
  let dataRequired = Math.round((recordingSeconds * bitrate) / 8 / 1024);

  return (
    <Link to={`/${projectId}/config/${props.config.configId}`}>
      <Hoverable>
        {(hovering) => (
          <View
            style={[
              styles.TableRow,
              hovering && styles.TableRowHover,
              selected && styles.TableRowSelected,
            ]}
          >
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>{props.config.configId}</Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>
                {props.config.mobile_network.hostname}
              </Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>
                {props.config.sensor.compress_data ? "On" : "Off"}
              </Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>
                {props.config.sensor.record_freq} Hz
              </Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>
                {props.config.sensor.record_length} sec
              </Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>
                {props.config.sensor.capture_delay} sec
              </Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>{hoursAwake} Hrs</Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>{recordingTime} Hrs</Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>{dataRequired} Mb</Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>
                {props.config.deployed
                  ? `${props.config.recorders.length}`
                  : ""}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.tableRowCell, { justifyContent: "center" }]}
              onPress={download}
            >
              <ExportIcon width={22} colour="#696974"></ExportIcon>
            </TouchableOpacity>
          </View>
        )}
      </Hoverable>
    </Link>
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

export default memo(ConfigurationPage);
