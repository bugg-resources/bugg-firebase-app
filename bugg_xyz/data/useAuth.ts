import firebase from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { Profile } from "../types";

// logged in UID
export const currentUidAtom = atom({
  key: `CurrentUID`,
  default: undefined as undefined | null | string,
});

const currentProfileAtom = atom({
  key: `CurrentProfile`,
  default: null as null | Profile,
});

const currentAuthProfileAtom = atom({
  key: `currentAuthProfileAtom`,
  default: null as null | User,
});

export function useCurrentUid(): string | null | undefined {
  return useRecoilValue(currentUidAtom);
}

export function useCurrentProfile(): Profile | null {
  return useRecoilValue(currentProfileAtom);
}

export function useCurrentAuthProfile() {
  return useRecoilValue(currentAuthProfileAtom);
}

/***
 * This is needed in the main tree to fill all the current profile values above
 */
export function useAuthListener() {
  const [currentUid, setCurrentUid] = useRecoilState(currentUidAtom);
  const setCurrentProfile = useSetRecoilState(currentProfileAtom);
  const setCurrentAuthProfile = useSetRecoilState(currentAuthProfileAtom);

  let [authStateLoaded, setAuthStateLoaded] = useState(false);

  let router = useRouter();

  useEffect(() => {
    if (!authStateLoaded) {
      return;
    }
    if (currentUid === null) {
      if (router.pathname !== "/login") {
        // not signed in, redirect
        router.push({
          pathname: "/login",
        });
      }
    }
  }, [router, currentUid, authStateLoaded]);

  // Watch the uid
  useEffect(() => {
    let auth = getAuth();
    let unsub = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setCurrentUid(null);
          setCurrentAuthProfile(null);
        } else {
          setCurrentUid(user.uid);
          setCurrentAuthProfile(user);
        }
        setAuthStateLoaded(true);
      },
      (err) => {
        console.error(err);
      },
      () => {
        console.log("done");
      }
    );
    return () => {
      console.log("onAuthStateChanged unsub");
      unsub();
    };
  }, [setCurrentUid, setCurrentAuthProfile, setAuthStateLoaded]);

  // watch the profile
  useEffect(() => {
    if (!currentUid) {
      setCurrentProfile(null);
      return;
    }

    let firestore = getFirestore();
    let unsub = onSnapshot(doc(firestore, `profiles/${currentUid}`), (snap) => {
      if (!snap.exists) {
        setCurrentProfile(null);
        return;
      }
      setCurrentProfile(snap.data() as Profile);
    });

    return () => {
      console.log("profile snapshot unsub");
      unsub();
    };
  }, [currentUid, setCurrentProfile]);
}

export function AuthListener(props: any) {
  useAuthListener();
  return null;
}
