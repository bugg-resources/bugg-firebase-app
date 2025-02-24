import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Recorder } from "../../types";
import Hoverable from "./Hover/Hoverable";
import { RecordIcon } from "./Icons";
import ReactMarker from "./MapPane/Map/ReactMarker";
import PlayButton from "./PlayButton";

interface BuggMapMarkerProps {
  device: Recorder;
  available: boolean;
  active: boolean;
  setActive: () => void;
}

function BuggMapMarker(props: BuggMapMarkerProps) {
  if (!props.device.location) {
    return null;
  }

  return (
    <ReactMarker
      id={`device-${props.device.deviceId}`}
      position={{
        lat: props.device.location.latitude,
        lng: props.device.location.longitude,
      }}
      zIndexOffset={props.active ? 1000 : 0}
    >
      <InactiveMarker {...props}></InactiveMarker>
      {/* {!props.active && <InactiveMarker {...props}></InactiveMarker>} */}

      {/* {props.active && <ActiveMarker {...props}></ActiveMarker>} */}
    </ReactMarker>
  );
}

function InactiveMarker(props: BuggMapMarkerProps) {
  return (
    <Hoverable>
      {(hovering) => (
        <TouchableOpacity
          style={[
            styles.inactiveMarker,
            props.available && styles.inactiveMarkerAvailable,
            hovering && styles.inactiveMarkerHover,
            {
              // @ts-ignore
              pointerEvents: "auto",
            },
          ]}
          onPress={props.setActive}
        >
          <View
            style={[
              styles.inactiveMarkerInner,
              props.available && styles.inactiveMarkerInnerAvailable,
            ]}
          >
            <Text style={{ color: "#FFF" }}>S</Text>
          </View>
        </TouchableOpacity>
      )}
    </Hoverable>
  );
}

function ActiveMarker(props: BuggMapMarkerProps) {
  return (
    <View
      style={[
        styles.activeMarker, // @ts-ignore
        { pointerEvents: "auto" },
      ]}
    >
      <PlayButton
        audioUrl={
          "https://firebasestorage.googleapis.com/v0/b/bugg-301712.appspot.com/o/audio%2Fprofile_123AA%2F00000000249ae42f%2Faudio-abcdefghjklmnopqrstw.mp3?alt=media"
        }
      ></PlayButton>
      <RecordIcon width={32}></RecordIcon>
      <Text style={styles.recordDate}>23 Nov, 18:33</Text>
      <Text style={styles.recorderId}>{props.device.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  BuggMapMarker: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163, 189, 199, 0.4)",
  },
  inactiveMarkerAvailable: {
    backgroundColor: "rgba(48, 200, 186, 0.4)",
  },
  inactiveMarkerInner: {
    backgroundColor: "#A3BDC7",
    width: 20,
    height: 20,
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  },
  inactiveMarkerInnerAvailable: {
    opacity: 1,
    backgroundColor: "#30C8BA",
  },
  inactiveMarkerHover: {
    transform: [{ scale: 1.1 }],
  },
  activeMarker: {
    backgroundColor: "#213B48",
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 12,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    height: 46,
    width: 256,
    transform: [{ translateX: 110 }, { translateY: 11 }],
    overflow: "hidden",
  },
  recordDate: {
    color: "#91A1AA",
    flexGrow: 1,
    marginLeft: 4,
    fontSize: 10,
    letterSpacing: -1.1,
  },
  recorderId: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 10,
  },
});

export default memo(BuggMapMarker);
