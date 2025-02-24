import { Switch } from "@headlessui/react";
import { DownloadIcon } from "@heroicons/react/outline";
import { CheckIcon } from "@heroicons/react/solid";
import {
  differenceInDays,
  differenceInHours,
  format,
  formatDistanceToNowStrict,
} from "date-fns";
import {
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  where,
} from "firebase/firestore";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "../classnames";
import AudioPlayer, { usePlayAudioUri } from "../components/AudioPlayer";
import BuggListBox from "../components/BuggListBox";
import { useLoadingBar } from "../components/LoadingBar";
import NavBar from "../components/NavBar";
import NavHeader from "../components/NavHeader";
import PlayButton from "../components/PlayButton";
import { toAudioUrl } from "../data/audioUtil";
import { getColour } from "../data/colourUtil";
import { useProjectId } from "../data/useProjects";
import { useAllRecorders } from "../data/useRecorders";
import { AudioRecord, Recorder } from "../types";

const Stream: NextPage = () => {
  let [audioRecords, setAudioRecords] = useState(null as null | AudioRecord[]);
  let currentProjectId = useProjectId();
  let recorders = useAllRecorders();

  let [justDetections, setJustDetections] = useState(false);

  let router = useRouter();
  let selectedRecorderId = router.query.bugg || null;
  let selectedRecorder =
    recorders.find((r) => r.deviceId === selectedRecorderId) || null;

  let setSelectedRecorder = useCallback(
    (recorder: Recorder | null) => {
      let query: any = {
        project: currentProjectId,
      };
      if (recorder) {
        query.bugg = recorder.deviceId;
      }

      router.replace({ query });
    },
    [router, currentProjectId]
  );

  let loadingBar = useLoadingBar();

  let [playingAudio, playAudio] = usePlayAudioUri();

  useEffect(() => {
    if (!currentProjectId) {
      return;
    }
    loadingBar.start();

    let ref = collection(getFirestore(), "audio");

    let queryParts = [
      where("project", "==", currentProjectId),
      justDetections && where("hasDetections", "==", true),

      // let startDate = new Date(new Date().getTime() - 24 * 60 * 60 * 7 * 1000);
      // let endDate = Date.now();
      // where("uploadedAt", ">=", startDate),
      // where("uploadedAt", "<=", endDate),
      selectedRecorderId && where("recorder", "==", selectedRecorderId),
    ].filter(Boolean) as QueryConstraint[];

    let q = query(
      ref,
      ...queryParts,
      orderBy("uploadedAt", "desc"),
      limit(200)
    );
    let unsub = onSnapshot(
      q,
      (snap) => {
        loadingBar.complete();
        let incomming = snap.docs.map((d) => d.data() as AudioRecord);
        setAudioRecords(incomming);
      },
      (err) => {
        loadingBar.complete();
        console.error(`Error getting audio`, err);
        alert("Error getting audio");
      }
    );

    return () => {
      unsub();
    };
  }, [
    currentProjectId,
    setAudioRecords,
    loadingBar,
    selectedRecorderId,
    justDetections,
  ]);

  let sortedRecorders = useMemo(() => {
    return [
      null,
      ...recorders
        .filter((r) => !!r.site)
        .sort((a, b) => a.site!.localeCompare(b.site!)),
    ];
  }, [recorders]);

  return (
    <>
      <Head>
        <title>Stream - Bugg</title>
        <link rel="icon" sizes="192x192" href="/favicon.png"></link>
      </Head>
      <NavBar></NavBar>

      <NavHeader title="Stream">
        <div className="hidden sm:block ml-1">
          <Switch.Group as="div" className="flex items-center">
            <Switch.Label as="span" className="mx-3">
              <span className="text-sm font-medium text-gray-900">
                {justDetections ? "Only detections" : "All Audio"}
              </span>
            </Switch.Label>
            <Switch
              checked={justDetections}
              onChange={setJustDetections}
              className={classNames(
                justDetections ? "bg-borange" : "bg-gray-200",
                "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange"
              )}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  justDetections ? "translate-x-5" : "translate-x-0",
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                )}
              />
            </Switch>
          </Switch.Group>
        </div>

        <div className="hidden sm:block ml-4 sm:w-64">
          <BuggListBox
            items={sortedRecorders}
            selected={selectedRecorder}
            setSelected={setSelectedRecorder}
            getItemKey={(item) => (item ? item?.deviceId : "All Recorders")}
            getItemTitle={(item) => (item ? item.name! : "All Recorders")}
            // getItemSubtitle={(item) => (item ? item.deviceId : "")}
          ></BuggListBox>
        </div>
      </NavHeader>
      <main className="bg-bgrey-200 grow flex flex-col p-0 sm:p-4 overflow-hidden">
        {!!audioRecords && audioRecords.length > 0 && (
          <div className="shadow overflow-scroll border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 z-20">
                <tr>
                  <th
                    scope="col"
                    className="hidden sm:table-cell px-6 py-3 sticky top-0 bg-gray-100"
                  >
                    <span className="sr-only">Play</span>
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100"
                  >
                    Uploaded
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100"
                  >
                    Site
                  </th>
                  <th
                    scope="col"
                    className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100"
                  >
                    Analyses
                  </th>
                  <th
                    scope="col"
                    className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-100"
                  >
                    Detections
                  </th>

                  <th
                    scope="col"
                    className="hidden sm:table-cell px-6 py-3 sticky top-0 bg-gray-100"
                  >
                    <span className="sr-only">Download</span>
                  </th>
                </tr>
              </thead>
              <tbody className="">
                {audioRecords.map((record, idx) => (
                  <tr
                    key={record.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-2 w-20 whitespace-nowrap text-sm font-medium text-gray-900">
                      <PlayButton
                        id={record.id}
                        uri={record.uri}
                        title={`${record.site} @ ${format(
                          record.uploadedAt.toDate(),
                          "HH:mm"
                        )}`}
                        date={record.uploadedAt.toDate()}
                        site={record.site}
                      ></PlayButton>
                    </td>

                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getFormattedTime(record.uploadedAt.toDate())}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {record.site}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-2 whitespace-nowrap text-sm text-gray-500 ">
                      {record.analysesPerformed.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-500 mr-1 mb-1"
                        >
                          {a}
                          {record.detections?.find(
                            (d) => d.analysisId === a
                          ) && (
                            <CheckIcon
                              width={15}
                              className="ml-1 text-green-500"
                            ></CheckIcon>
                          )}
                        </span>
                      ))}
                    </td>
                    <td className="hidden sm:table-cell  px-6 py-2  text-sm text-gray-500">
                      {record.detections?.map((d) => {
                        return (
                          <span
                            key={d.id}
                            className={classNames(
                              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-800 border-2 mr-1 mb-1",
                              d.uri && "cursor-pointer",
                              playingAudio?.id === `${record.id}-${d.id}` &&
                                "border-borange"
                            )}
                            style={{
                              borderColor:
                                playingAudio?.id === `${record.id}-${d.id}`
                                  ? undefined
                                  : getColour(
                                      d.tags.length ? d.tags[0] : d.analysisId
                                    ),
                              backgroundColor: getColour(
                                d.tags.length ? d.tags[0] : d.analysisId
                              ),
                            }}
                            onClick={
                              d.uri
                                ? () =>
                                    playAudio({
                                      id: `${record.id}-${d.id}`,
                                      uri: d.uri!,
                                      date: d.time?.toDate(),
                                      title:
                                        d.analysisId === "anomaly-detection"
                                          ? "Anomaly"
                                          : d.tags.join(" "),
                                      site: record.site,
                                    })
                                : undefined
                            }
                          >
                            {d.uri && (
                              <span className="text-gray-800 mr-1 no-underline">
                                ►
                              </span>
                            )}
                            <span className={classNames(d.uri && "underline")}>
                              {d.analysisId === "anomaly-detection" &&
                                "Anomaly"}
                              {d.analysisId !== "anomaly-detection" &&
                                d.tags.join(" ")}
                            </span>
                          </span>
                        );
                      })}
                    </td>

                    <td className="hidden sm:table-cell px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        className="inline-flex items-center p-0 border border-transparent rounded-full  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange"
                        onClick={async () => {
                          let anchor = document.createElement("a");
                          anchor.href = await toAudioUrl(record.uri);
                          anchor.target = "_blank";
                          anchor.download = `${record.site}_${
                            record.uploadedAt.toDate().toISOString
                          }.mp3`;
                          anchor.click();
                        }}
                      >
                        <DownloadIcon
                          width={20}
                          className="text-borange hover:opacity-90"
                        ></DownloadIcon>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <AudioPlayer></AudioPlayer>

            {/* <nav
              className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
              aria-label="Pagination"
            >
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{audioRecords.length}</span>{" "}
                  results
                </p>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <a
                  href="#"
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </a>
                <a
                  href="#"
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </a>
              </div>
            </nav> */}
          </div>
        )}
      </main>
    </>
  );
};

export default Stream;

function getFormattedTime(date: Date) {
  // If less than an hour show relative
  if (differenceInHours(new Date(), date) < 1) {
    return formatDistanceToNowStrict(date, {
      addSuffix: true,
    });
  }

  // if less than one day show the time
  if (differenceInDays(new Date(), date) < 1) {
    return format(date, "HH:mm");
  }

  // Show the date and time

  return format(date, "HH:mm, dd-MM-yyyy");
}
