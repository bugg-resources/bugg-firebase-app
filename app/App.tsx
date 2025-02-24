import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";
import React, { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import { RecoilRoot } from "recoil";
import LoadingBar from "./src/components/LoadingBar";
import { AuthListener } from "./src/data/useAuth";
import "./src/initFirebase";
import Router from "./src/Router";

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  return (
    <Suspense fallback={<LoadingScreen></LoadingScreen>}>
      <RecoilRoot>
        <AuthListener>
          <LoadingBar></LoadingBar>
          {!fontsLoaded && <LoadingScreen></LoadingScreen>}
          {fontsLoaded && <Router></Router>}
        </AuthListener>
      </RecoilRoot>
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={"#30C8BA"}></ActivityIndicator>
    </View>
  );
}
