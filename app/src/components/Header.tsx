import { Link, useRoute } from "@react-navigation/native";
import React, { memo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import DateRangeSelector from "./DateRangeSelector";
import DeviceSelector from "./DeviceSelector";
import {
  BuggLogo,
  ChartsPageIcon,
  MapIcon,
  SettingsIcon,
  TableViewIcon,
} from "./Icons";
import SegmentedControl, { SegmentedControlSegment } from "./SegmentedControl";
import TagSelector from "./TagSelector";

interface HeaderProps {
  small?: boolean;
}

function Header(props: HeaderProps) {
  let dims = useWindowDimensions();
  if (props.small || dims.width < 769) {
    return <MobileHeader></MobileHeader>;
  }

  return <DesktopHeader></DesktopHeader>;
}

function DesktopHeader(props: HeaderProps) {
  let route = useRoute();
  let projectId = (route.params as any)?.projectId;

  return (
    <View style={styles.Header}>
      <Link to={`/${projectId}/map`} style={styles.logo}>
        <View style={styles.logo}>
          <BuggLogo width={150}></BuggLogo>
        </View>
      </Link>
      <Seperator></Seperator>
      <DateRangeSelector></DateRangeSelector>
      <Seperator></Seperator>
      <DeviceSelector></DeviceSelector>
      <Seperator></Seperator>
      <TagSelector></TagSelector>
      <Seperator></Seperator>
      <ViewToggle></ViewToggle>

      <Seperator></Seperator>
      <Button
        link={`/${projectId}/settings`}
        active={route.name === "DeviceSettingsPage"}
      >
        <View style={styles.icon}>
          <SettingsIcon colour={"#A4BDC8"} width={17}></SettingsIcon>
        </View>
      </Button>
    </View>
  );
}

function MobileHeader(props: HeaderProps) {
  return (
    <View style={styles.MobileHeader}>
      <View style={styles.mobileRow}>
        <View style={styles.logo}>
          <BuggLogo width={150}></BuggLogo>
        </View>
        <Seperator></Seperator>
        <ViewToggle></ViewToggle>
      </View>
      {/* <View style={styles.mobileRow}>
        <DateRangeSelector></DateRangeSelector>
      </View> */}
      <View style={[{ zIndex: 10 }]}>
        <TagSelector></TagSelector>
      </View>
      <View style={[{ marginTop: 8 }]}>
        <DeviceSelector></DeviceSelector>
      </View>
    </View>
  );
}

function ViewToggle() {
  let route = useRoute();
  let projectId = (route.params as any)?.projectId;

  return (
    <SegmentedControl>
      <SegmentedControlSegment
        link={`/${projectId}/map`}
        first={true}
        active={route.name === "DashboardMapPage"}
      >
        <View style={styles.icon}>
          <MapIcon colour={"#A4BDC8"} width={17}></MapIcon>
        </View>
      </SegmentedControlSegment>
      <SegmentedControlSegment
        link={`/${projectId}/charts`}
        active={route.name === "DashboardChartsPage"}
      >
        <View style={styles.icon}>
          <ChartsPageIcon colour={"#A4BDC8"} width={27}></ChartsPageIcon>
        </View>
      </SegmentedControlSegment>
      <SegmentedControlSegment
        link={`/${projectId}/table`}
        active={route.name === "DashboardTablePage"}
      >
        <View style={styles.icon}>
          <TableViewIcon colour={"#A4BDC8"} width={17}></TableViewIcon>
        </View>
      </SegmentedControlSegment>
    </SegmentedControl>
  );
}

function Seperator() {
  return <View style={styles.sep}></View>;
}

interface ButtonProps {
  link: string;
  active: boolean;
  children?: any;
}

export function Button(props: ButtonProps) {
  return (
    <Link
      to={props.link}
      style={[styles.Button, props.active && styles.ButtonActive]}
    >
      {props.children}
    </Link>
  );
}

const styles = StyleSheet.create({
  Header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 10,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  logo: {
    height: 38,
    flexGrow: 1,
  },
  sep: {
    width: 8,
  },

  MobileHeader: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 8,
    zIndex: 10,
    width: "100%",
    marginTop: 24,
    marginBottom: 8,
  },
  mobileRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  icon: {},
  Button: {
    height: 38,
    width: 38,

    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#BDCBD4",
    borderRadius: 8,
    overflow: "hidden",
  },
  ButtonActive: {
    backgroundColor: "#EFF0F4",
  },
});

export default memo(Header);
