import { DocumentDuplicateIcon, DownloadIcon } from "@heroicons/react/outline";
import { PlusIcon } from "@heroicons/react/solid";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import NavBar from "../components/NavBar";
import NavHeader from "../components/NavHeader";
import { downloadConfig } from "../data/configUtil";
import { useProjectId } from "../data/useProjects";
import { useConfigs } from "../data/useConfigs";

const Configurations: NextPage = () => {
  let currentProjectId = useProjectId();
  let configs = useConfigs();

  return (
    <>
      <Head>
        <title>Configurations - Bugg</title>
        <link rel="icon" sizes="192x192" href="/favicon.png"></link>
      </Head>
      <NavBar></NavBar>

      <NavHeader title="Configurations">
        <Link href="/configuration">
          <a className="ml-4 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-borange hover:opacity-90">
            <PlusIcon width={17}></PlusIcon>
          </a>
        </Link>
      </NavHeader>
      <main className="bg-bgrey-200 grow flex flex-col p-0 sm:p-4">
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              {configs && configs.length && (
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Config
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          APN
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Compresstion
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Frequency
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Recording Length
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Recording Interval
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Awake For
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Recording
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Daily Data
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Deployments
                        </th>

                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Download</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((config, idx) => {
                        console.log("config", config);

                        let hoursAwake = config.sensor.awake_times.length;
                        let recordingTime = `${hoursAwake}`;
                        let recordingSeconds = hoursAwake * 60 * 60;

                        let l = config.sensor.record_length;
                        let d = config.sensor.capture_delay;
                        let t = Math.round((l / (d + l)) * hoursAwake);
                        if (!isNaN(t)) {
                          recordingTime = `${t}`;
                          recordingSeconds = t * 60 * 60;
                        }

                        let bitrate = 120;
                        let dataRequired = Math.round(
                          (recordingSeconds * bitrate) / 8 / 1024
                        );

                        return (
                          <tr
                            key={config.configId}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {config.configId}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {config.mobile_network.hostname}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {config.sensor.compress_data ? "On" : "Off"}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {config.sensor.record_freq} Hz
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {config.sensor.record_length} sec
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {config.sensor.capture_delay} sec
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hoursAwake} Hrs
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {recordingTime} Hrs
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dataRequired} Mb
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {config.deployed
                                ? `${config.recorders.length}`
                                : ""}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/configuration?config=${config.configId}`}
                              >
                                <a className="inline-flex items-center p-0 border border-transparent rounded-full  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange">
                                  <DocumentDuplicateIcon
                                    width={20}
                                    className="text-borange hover:opacity-90"
                                  ></DocumentDuplicateIcon>
                                </a>
                              </Link>

                              <button
                                type="button"
                                className="ml-4 inline-flex items-center p-0 border border-transparent rounded-full  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange"
                                onClick={() => {
                                  if (currentProjectId) {
                                    downloadConfig(currentProjectId, config);
                                  }
                                }}
                              >
                                <DownloadIcon
                                  width={20}
                                  className="text-borange hover:opacity-90"
                                ></DownloadIcon>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Configurations;
