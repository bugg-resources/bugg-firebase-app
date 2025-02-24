import { format } from "date-fns";
import firebase from "firebase/app";
import React, { memo, useCallback } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PlayButton from "./PlayButton";

interface RecordingListProps {
  recordings: PartialAudio[];
}

interface PartialAudio {
  id: string;
  createdAt?: firebase.firestore.Timestamp;
  // the time given to us by the bugg
  uploadedAt: firebase.firestore.Timestamp;
  uri: string;
}

function RecordingList(props: RecordingListProps) {
  let recordings = props.recordings;

  let renderItem = useCallback((info: ListRenderItemInfo<PartialAudio>) => {
    return <RecordingRow audio={info.item}></RecordingRow>;
  }, []);

  return (
    <FlatList
      style={[styles.RecordingList]}
      data={recordings}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <Seperator></Seperator>}
    />
  );
}

function Seperator(props: any) {
  return <View style={[styles.seperator]}></View>;
}

interface RecordingRowProps {
  audio: PartialAudio;
}

function RecordingRow(props: RecordingRowProps) {
  let audio = props.audio;

  let uploadDate = format(audio.uploadedAt.toDate(), "MMM do, yyyy HH:mm:ss");

  return (
    <View style={styles.row}>
      <View style={styles.playButtonContainer}>
        <PlayButton audioUrl={audio.uri}></PlayButton>
      </View>
      <Text style={styles.recordingDate}>{uploadDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  RecordingList: {
    marginTop: 8,
    flexBasis: 1,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: "100%",
  },
  seperator: {
    height: 2,
    backgroundColor: "#F4F5F7",
    paddingHorizontal: 16,
  },

  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  playButtonContainer: {
    width: 64,
  },
  recordingDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#696974",
    marginRight: 12,
  },
});

export default memo(RecordingList);
