import { DownloadIcon, PlusIcon } from "@heroicons/react/outline";
import { format } from "date-fns";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { NextPage } from "next";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import ExportRequestSlideOver from "../components/ExportRequestSlideOver";
import { useLoadingBar } from "../components/LoadingBar";
import NavBar from "../components/NavBar";
import NavHeader from "../components/NavHeader";
import { useProjectId } from "../data/useProjects";
import { ExportJob } from "../types";

const ExportPage: NextPage = () => {
  let [exportJobs, setExportJobs] = useState(null as null | ExportJob[]);
  let currentProjectId = useProjectId();
  let [slideOutOpen, setSlideOutOpen] = useState(false);

  let loadingBar = useLoadingBar();

  useEffect(() => {
    if (!currentProjectId) {
      return;
    }
    loadingBar.start();

    let ref = collection(getFirestore(), "exports");
    let q = query(
      ref,
      where("projectId", "==", currentProjectId),
      orderBy("createdAt", "desc")
    );
    let unsub = onSnapshot(q, (snap) => {
      loadingBar.complete();
      let incomming = snap.docs.map(
        (d) => Object.assign({ id: d.id }, d.data()) as ExportJob
      );
      setExportJobs(incomming);
    });

    return () => {
      unsub();
    };
  }, [currentProjectId, setExportJobs, loadingBar]);

  let download = useCallback(async (job: ExportJob) => {
    if (!job.uri) {
      alert("Missing URL on Job. This shouldn't happen.");
      return;
    }

    let storage = getStorage();
    let storageRef = ref(storage, job.uri);

    let link = await getDownloadURL(storageRef);
    console.log(link);
    if (typeof window !== undefined) {
      let w = window!.open(link, "_blank");
      if (w) {
        w.focus();
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>Export - Bugg</title>
        <link rel="icon" sizes="192x192" href="/favicon.png"></link>
      </Head>
      <NavBar></NavBar>

      <NavHeader title="All Exports">
        <button
          type="button"
          className="ml-4 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-borange hover:opacity-90"
          onClick={() => setSlideOutOpen(true)}
        >
          <PlusIcon width={17}></PlusIcon>
        </button>
      </NavHeader>

      <main className="bg-bgrey-200 grow flex flex-col p-0 sm:p-4">
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              {exportJobs && (
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          STARTED
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          TYPE
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          FROM
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          To
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Records
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>

                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Download</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportJobs.map((job, idx) => (
                        <tr
                          key={job.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {job.beganProcessing
                              ? format(
                                  job.beganProcessing.toDate(),
                                  "dd-MM-yyyy HH:mm"
                                )
                              : ""}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {job.type}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {job.from
                              ? format(job.from.toDate(), "dd-MM-yyyy")
                              : "-"}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {job.to
                              ? format(job.to.toDate(), "dd-MM-yyyy")
                              : job.beganProcessing
                              ? format(
                                  job.beganProcessing.toDate(),
                                  "dd-MM-yyyy"
                                )
                              : ""}
                          </td>

                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {job.recordsProcessed}
                          </td>

                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {job.status}
                          </td>

                          <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              className="inline-flex items-center p-0 border border-transparent rounded-full  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange"
                              onClick={() => {
                                download(job);
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
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <ExportRequestSlideOver
        open={slideOutOpen}
        setOpen={setSlideOutOpen}
      ></ExportRequestSlideOver>
    </>
  );
};

export default ExportPage;
