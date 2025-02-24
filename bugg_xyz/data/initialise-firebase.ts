import { deleteApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { useEffect } from "react";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";

const firebaseConfig = {
  apiKey: "AIzaSyDOvWn9SDi-L3X71DgF_yZ82nN31g41RPE",
  authDomain: "bugg-301712.firebaseapp.com",
  projectId: "bugg-301712",
  storageBucket: "bugg-301712.appspot.com",
  messagingSenderId: "444984640481",
  appId: "1:444984640481:web:e24d1736cd7021f55dc8a0",
  measurementId: "G-LSYV4JNNYV",
};

export const hasFirebaseAppLoadedAtom = atom({
  key: "hasFirebaseAppLoadedAtom",
  default: false,
});

export function useHasFirebaseAppLoaded() {
  return useRecoilValue(hasFirebaseAppLoadedAtom);
}

export default function FirebaseInitialiser(props: { children?: any }) {
  let [hasFirebaseAppLoaded, setHasFirebaseAppLoaded] = useRecoilState(
    hasFirebaseAppLoadedAtom
  );

  useEffect(() => {
    let a = initializeApp(firebaseConfig);

    setHasFirebaseAppLoaded(true);
    return () => {
      setHasFirebaseAppLoaded(false);
      deleteApp(a);
      console.log("DELETED FIREBASE APP");
    };
  }, [setHasFirebaseAppLoaded]);

  if (!hasFirebaseAppLoaded) {
    return null;
  }

  return props.children || null;
}
