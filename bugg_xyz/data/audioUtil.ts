import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { AudioRecord } from "../types";

export async function toAudioUrl(audioStorageUri: string) {
  let r = ref(getStorage(), audioStorageUri);
  let url = await getDownloadURL(r);
  return url;
}
