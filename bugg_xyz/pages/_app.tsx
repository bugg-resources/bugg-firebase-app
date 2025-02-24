import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";
import LoadingBar from "../components/LoadingBar";
import FirebaseInitialiser from "../data/initialise-firebase";
import { AuthListener } from "../data/useAuth";
import { ProjectsWatcher } from "../data/useProjects";
import { RecordersFetcher } from "../data/useRecorders";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <FirebaseInitialiser>
        <AuthListener></AuthListener>
        <ProjectsWatcher></ProjectsWatcher>
        <RecordersFetcher></RecordersFetcher>
      </FirebaseInitialiser>

      <LoadingBar>
        <Component {...pageProps} />
      </LoadingBar>
    </RecoilRoot>
  );
}

export default MyApp;
