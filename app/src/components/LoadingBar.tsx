import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { atom, useRecoilValue, useSetRecoilState } from "recoil";

interface LoadingBarProps {}

export const isLoadingAtom = atom({
  key: "isLoadingAtom",
  default: false,
});

export function useSetLoading() {
  return useSetRecoilState(isLoadingAtom);
}

function LoadingBar(props: LoadingBarProps) {
  let isLoading = useRecoilValue(isLoadingAtom);
  const widthAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading) {
      widthAnim.setValue(0);
      fadeAnim.setValue(1);
      Animated.timing(widthAnim, {
        toValue: 0.9,
        duration: 10000,
        useNativeDriver: false,
      }).start();
    }

    if (!isLoading) {
      Animated.timing(widthAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1300,
        useNativeDriver: false,
      }).start();
    }
  }, [isLoading, fadeAnim]);

  return (
    <View style={styles.LoadingBar}>
      <Animated.View
        style={[
          styles.progress,
          {
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
            opacity: fadeAnim,
          },
        ]}
      ></Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  LoadingBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    zIndex: 1000,
  },
  progress: {
    height: 3,
    backgroundColor: "#2AC9BA",
  },
});

export default memo(LoadingBar);
