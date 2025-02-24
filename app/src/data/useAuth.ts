import firebase from "firebase/app";
import { useEffect } from "react";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { Profile } from "../../types";

// logged in UID
export const currentUidAtom = atom({
  key: `CurrentUID`,
  default: undefined as undefined | null | string,
});

const currentProfileAtom = atom({
  key: `CurrentProfile`,
  default: null as null | Profile,
});

export function useCurrentUid(): string | null | undefined {
  return useRecoilValue(currentUidAtom);
}

export function useCurrentProfile(): Profile | null {
  return useRecoilValue(currentProfileAtom);
}

/***
 * This is needed in the main tree to fill all the current profile values above
 */
export function useAuthListener() {
  const [currentUid, setCurrentUid] = useRecoilState(currentUidAtom);
  const setCurrentProfile = useSetRecoilState(currentProfileAtom);

  // Watch the uid
  useEffect(() => {
    let unsub = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        setCurrentUid(null);
      } else {
        setCurrentUid(user.uid);
      }
    });
    return () => {
      unsub();
    };
  }, [setCurrentUid]);

  // watch the profile
  useEffect(() => {
    if (!currentUid) {
      setCurrentProfile(null);
      return;
    }

    let unsub = firebase
      .firestore()
      .doc(`profiles/${currentUid}`)
      .onSnapshot((snap) => {
        if (!snap.exists) {
          setCurrentProfile(null);
          return;
        }
        setCurrentProfile(snap.data() as Profile);
      });

    return () => {
      unsub();
    };
  }, [currentUid, setCurrentProfile]);
}

export function AuthListener(props: any) {
  useAuthListener();
  return props.children;
}
