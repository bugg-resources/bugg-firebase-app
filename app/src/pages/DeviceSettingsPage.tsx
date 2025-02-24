import { useRoute } from "@react-navigation/core";
import { Link } from "@react-navigation/native";
import { subHours } from "date-fns";
import { format } from "date-fns/esm";
import firebase from "firebase/app";
import React, { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRecoilValue } from "recoil";
import { AudioRecord, Recorder, RecorderConfig } from "../../types";
import AssignLocationEditor from "../components/AssignLocationEditor";
import Header from "../components/Header";
import Hoverable from "../components/Hover/Hoverable";
import RecordingList from "../components/RecordingList";
import { allRecordersAtom, useApplication } from "../data/useApplication";

interface DeviceSettingsPageProps {}

function DeviceSettingsPage(props: DeviceSettingsPageProps) {
  let route = useRoute();
  let { projectId, deviceId } = route.params as any;

  useApplication(projectId);

  let recorders = useRecoilValue(allRecordersAtom);
  let selectedRecorder = recorders.find((r) => r.deviceId === deviceId);
  let selectedRecorderNeedsSetup =
    selectedRecorder?.name === "UNSET" && !selectedRecorder?.location;

  let [recordings, setRecordings] = useState(null as null | AudioRecord[]);
  useEffect(() => {
    if (!deviceId) {
      return;
    }
    setRecordings(null);

    let oneHrAgo = subHours(new Date(), 1);
    let unsub = firebase
      .firestore()
      .collection("audio")
      .where("project", "==", projectId)
      .where("recorder", "==", deviceId)
      .where("uploadedAt", ">=", oneHrAgo)
      .orderBy("uploadedAt", "desc")
      .onSnapshot((snaps) => {
        let audio = snaps.docs.map((d) => d.data() as AudioRecord);
        setRecordings(audio);
      });

    return () => {
      unsub();
    };
  }, [projectId, deviceId]);

  let [deviceConfig, setDeviceConfig] = useState(null as null | RecorderConfig);
  useEffect(() => {
    if (!selectedRecorder || !selectedRecorder.configId) {
      return;
    }

    firebase
      .firestore()
      .doc(`config/${selectedRecorder.configId}`)
      .get()
      .then((snapshot) => {
        if (snapshot.exists) {
          setDeviceConfig(snapshot.data() as RecorderConfig);
        }
      });
  }, [selectedRecorder]);

  return (
    <View style={styles.page}>
      <Header></Header>

      <View style={styles.titleBar}>
        <Text style={styles.title}>Bugg Manager</Text>
        <View style={styles.actions}>
          <Link to={`/${projectId}/config`}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Configurations</Text>
            </View>
          </Link>
        </View>
        <Link to={`/${projectId}/exports`}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Export</Text>
          </View>
        </Link>
      </View>

      <View style={styles.row}>
        <View style={styles.leftPanel}>
          <View style={[styles.TableRow, styles.TableRowHeader]}>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableHeaderText}>SITE</Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableHeaderText}>DEVICE I.D.</Text>
            </View>

            <View style={styles.tableRowCell}>
              <Text style={styles.tableHeaderText}>LAST UPLOAD TIME</Text>
            </View>
          </View>
          {recorders.map((r) => (
            <TableRow
              key={r.deviceId}
              recorder={r}
              projectId={projectId}
              selected={deviceId === r.deviceId}
            ></TableRow>
          ))}
        </View>

        {selectedRecorder && (
          <View style={styles.rightPanel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelHeaderTitle}>
                <Text style={styles.panelTitle}>{selectedRecorder.name}</Text>
                <Text style={styles.panelSubtitle}>
                  {selectedRecorder.deviceId}
                </Text>
              </View>
              <View style={styles.panelHeaderActions}>
                <Link to={`/${projectId}/settings/${deviceId}/assign`}>
                  <View
                    style={[
                      styles.button,
                      selectedRecorderNeedsSetup && styles.buttonHighlight,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {selectedRecorderNeedsSetup ? "Assign " : ""}Location
                    </Text>
                  </View>
                </Link>
              </View>
            </View>
            {deviceConfig && (
              <View style={styles.panelConfig}>
                <View style={styles.panelConfigSection}>
                  <Text style={styles.panelConfigTitle}>
                    Mobile Internet APN
                  </Text>

                  <View style={styles.kvgroup}>
                    <Text style={styles.key}>APN</Text>
                    <Text style={styles.value}>
                      {deviceConfig.mobile_network.hostname}
                    </Text>
                  </View>
                  <View style={styles.kvgroup}>
                    <Text style={styles.key}>User</Text>
                    <Text style={styles.value}>
                      {deviceConfig.mobile_network.username}
                    </Text>
                  </View>
                </View>
                <View style={styles.panelConfigSection}>
                  <Text style={styles.panelConfigTitle}>
                    Recording Parameters
                  </Text>

                  <View style={styles.kvgroup}>
                    <Text style={styles.key}>Sample Rate</Text>
                    <Text style={styles.value}>
                      {deviceConfig.sensor.record_freq} Hz
                    </Text>
                  </View>
                  <View style={styles.kvgroup}>
                    <Text style={styles.key}>Recording Length</Text>
                    <Text style={styles.value}>
                      {deviceConfig.sensor.record_length} Secs
                    </Text>
                  </View>
                  <View style={styles.kvgroup}>
                    <Text style={styles.key}>Recording Interval</Text>
                    <Text style={styles.value}>
                      {deviceConfig.sensor.capture_delay} Secs
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.recordingsList}>
              <View style={styles.recordingsListTitleContainer}>
                <Text style={styles.recordingsListTitle}>Bugg Recordings</Text>
                {recordings && (
                  <Text style={styles.recordingsListSubtitle}>
                    Last Hour ({recordings.length})
                  </Text>
                )}

                {!recordings && (
                  <Text style={styles.recordingsListSubtitle}>Loading...</Text>
                )}
              </View>

              {(!recordings || recordings.length === 0) &&
                selectedRecorder.lastUpload && (
                  <RecordingList
                    recordings={[selectedRecorder.lastUpload]}
                  ></RecordingList>
                )}

              {recordings && (
                <RecordingList recordings={recordings}></RecordingList>
              )}
            </View>
          </View>
        )}
      </View>
      <AssignLocationEditor device={selectedRecorder}></AssignLocationEditor>
    </View>
  );
}

interface TableRowProps {
  recorder: Recorder;
  projectId: string;
  selected: boolean;
}

function TableRow(props: TableRowProps) {
  let lastUploadTime = props.recorder.lastUpload?.uploadedAt.toDate();
  let lastUploadTimeFormatted = "No Contact";
  if (lastUploadTime) {
    lastUploadTimeFormatted = format(lastUploadTime, "MMM do, yyyy");
  }

  let needsSetup = props.recorder.name === "UNSET" && !props.recorder.location;

  return (
    <Link to={`/${props.projectId}/settings/${props.recorder.deviceId}`}>
      <Hoverable>
        {(hovering) => (
          <View
            style={[
              styles.TableRow,
              hovering && styles.TableRowHover,
              props.selected && styles.TableRowSelected,
            ]}
          >
            <View style={styles.tableRowCell}>
              <Text
                style={[
                  styles.tableRowText,
                  needsSetup && styles.tableRowTextHighlight,
                ]}
              >
                {props.recorder.name}
              </Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text
                style={[
                  styles.tableRowText,
                  needsSetup && styles.tableRowTextHighlight,
                ]}
              >
                {props.recorder.deviceId}
              </Text>
            </View>
            <View style={styles.tableRowCell}>
              <Text style={styles.tableRowText}>{lastUploadTimeFormatted}</Text>
            </View>
          </View>
        )}
      </Hoverable>
    </Link>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#F6F6F9",
    display: "flex",
    flexDirection: "column",
    flexBasis: 1,
    flexGrow: 1,
    flexShrink: 1,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    flexGrow: 1,
    flexBasis: 1,
    flexShrink: 1,
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
    width: 150,
    paddingVertical: 8,
    marginLeft: 8,
  },
  buttonHighlight: {
    backgroundColor: "#ED6237",
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "flex-start",
    minHeight: "80%",
    marginHorizontal: 16,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 1,
  },
  leftPanel: {
    flexGrow: 1,
    overflow: "scroll",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginRight: 8,
  },
  rightPanel: {
    flexGrow: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginLeft: 8,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
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
  tableRowTextHighlight: {
    color: "#FF6464",
  },
  panelHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  panelHeaderTitle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  panelTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    color: "#273946",
  },
  panelSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#696974",
  },
  panelHeaderActions: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    flexGrow: 1,
  },
  panelConfig: {
    padding: 4,
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  panelConfigSection: {
    display: "flex",
    flexDirection: "column",
    padding: 12,
    flexGrow: 1,
    marginTop: 8,
  },
  panelConfigTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    paddingBottom: 2,
    color: "#696974",
    borderBottomWidth: 1,
    borderBottomColor: "#979797",
    borderStyle: "solid",
  },
  kvgroup: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  key: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#696974",
    marginRight: 12,
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#696974",
  },
  recordingsList: {
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingBottom: 16,
    flexGrow: 1,
  },
  recordingsListTitleContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  recordingsListTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#696974",
  },
  recordingsListSubtitle: {
    fontFamily: "Inter_300Light",
    fontStyle: "italic",
    fontSize: 13,
  },
});

export default memo(DeviceSettingsPage);
