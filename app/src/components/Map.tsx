import { LatLngTuple } from "leaflet";
import React, { memo, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { StyleSheet, View } from "react-native";
import { useRecoilValue } from "recoil";
import {
  allRecordersAtom,
  availableRecorderIdsInFilteredSetAtom,
} from "../data/useApplication";
import useLayout from "../data/useLayout";
import BuggMapMarker from "./BuggMapMarker";

interface MapPaneProps {}

function MapPane(props: MapPaneProps) {
  let [size, onLayout] = useLayout();
  let recorders = useRecoilValue(allRecordersAtom);
  let availableRecorderIds = useRecoilValue(
    availableRecorderIdsInFilteredSetAtom
  );

  let bounds: [LatLngTuple, LatLngTuple] | undefined = useMemo(() => {
    let thereAreRecordersWithLocation = recorders.some((r) => !!r.location);

    if (!thereAreRecordersWithLocation) {
      return undefined;
    }

    let minLat = 999;
    let minLon = 999;

    let maxLat = -1;
    let maxLon = -1;

    for (let r of recorders) {
      if (!r.location) {
        continue;
      }
      if (r.location.latitude < minLat) {
        minLat = r.location.latitude;
      }
      if (r.location.longitude < minLon) {
        minLon = r.location.longitude;
      }
      if (maxLat < r.location.latitude) {
        maxLat = r.location.latitude;
      }
      if (maxLon < r.location.longitude) {
        maxLon = r.location.longitude;
      }
    }

    return [
      [maxLat, minLon],
      [minLat, maxLon],
    ];
  }, [recorders]);

  let [activeRecorderId, setActiveRecorderId] = useState("");

  return (
    <View style={styles.MapPane} onLayout={onLayout}>
      {recorders.length > 0 && (
        <MapContainer
          key={`${size?.height} ${size?.width}`}
          style={{ width: size?.width, height: size?.height }}
          bounds={bounds}
          scrollWheelZoom={true}
          maxZoom={19}
          zoomControl={true}
          preferCanvas={true}
          attributionControl={true}
        >
          {/* maxZoom={12} */}
          {/* <TileLayer
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          /> */}

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {recorders.map((r) => (
            <BuggMapMarker
              key={r.deviceId}
              device={r}
              available={availableRecorderIds.has(r.deviceId)}
              active={activeRecorderId === r.deviceId}
              setActive={() => {
                setActiveRecorderId(r.deviceId);
              }}
            ></BuggMapMarker>
          ))}
        </MapContainer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  MapPane: {
    flex: 1,
    backgroundColor: "#B1C5C1",
  },
});

export default memo(MapPane);
