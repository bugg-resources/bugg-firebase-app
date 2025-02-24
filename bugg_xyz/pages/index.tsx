import { subDays } from "date-fns";
import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import BuggSummaryPanel from "../components/BuggSummaryPanel";
import DateRangeSelector from "../components/DateRangeSelector";
import { useLoadingBar } from "../components/LoadingBar";
import NavBar from "../components/NavBar";
import NavHeader from "../components/NavHeader";
import { useHasFirebaseAppLoaded } from "../data/initialise-firebase";
import { useProject, useProjectId } from "../data/useProjects";
import { useAllRecorders } from "../data/useRecorders";
import { AudioRecord } from "../types";
import { useConfigs } from "../data/useConfigs";

const Home: NextPage = () => {
  const MapPanel = dynamic(
    () => import("../components/MapPanel"),
    { ssr: false } // This line is important. It's what prevents server-side render
  );

  let [daysToSearch, setDaysToSearch] = useState(1);

  // let recorderHoursMatrix = useMemo(() => {
  //   if (!(recorders.length && configs?.length && audioRecords.length)) {
  //     return {};
  //   }

  //   let matrix = {} as {
  //     [recorderId: string]: { hours: number; files: number };
  //   };
  //   for (let r of recorders) {
  //     let audio = audioRecords.filter((a) => a.recorder === r.deviceId);
  //     let config = configs.find((c) => c.configId === r.configId);
  //     if (audio.length && config) {
  //       let secondsRecorded = audio.length * config.sensor.record_length;
  //       matrix[r.deviceId] = {
  //         hours: Math.round(secondsRecorded / 60 / 60),
  //         files: audio.length,
  //       };
  //     }
  //   }

  //   return matrix;
  // }, [recorders, configs, audioRecords]);

  return (
    <>
      <Head>
        <title>Dashboard - Bugg</title>
        <link rel="icon" sizes="192x192" href="/favicon.png"></link>
      </Head>
      <NavBar></NavBar>

      <NavHeader title={"Manager"}>
        <DateRangeSelector
          daysToSearch={daysToSearch}
          setDaysToSearch={setDaysToSearch}
        ></DateRangeSelector>
      </NavHeader>
      <main className="bg-bgrey-200 grow flex flex-col">
        <div className="grow grid gap-1 sm:grid-cols-1 lg:grid-cols-1">
          <div className="max-w-full pt-4 sm:px-4 lg:px-4 h-fit">
            <BuggSummaryPanel days={daysToSearch}></BuggSummaryPanel>
          </div>

          {/* <div className="grow-1 hidden lg:flex justify-items-stretch">
            {typeof window !== "undefined" && <MapPanel></MapPanel>}
          </div> */}
        </div>
      </main>
    </>
  );
};

export default Home;
