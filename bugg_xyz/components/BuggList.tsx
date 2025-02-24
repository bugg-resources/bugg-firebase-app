import { ExclamationCircleIcon } from "@heroicons/react/outline";
import { ChevronRightIcon } from "@heroicons/react/solid";
import { formatDistance } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { Recorder } from "../types";
import BuggDetailFlyout from "./BuggDetailFlyout";
import Online24HrIndicator from "./Online24HrIndicator";

// const buggs = [
//   {
//     id: 1,
//     name: "Riverside",
//     href: "#",
//     updated: "15 mins ago",
//     files: 134,
//     files24Hr: 11,
//     active: false,
//     files24HrDistribution: [
//       0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//     ],
//     missingLocation: true,
//   },
// ];

interface BuggListProps {
  recorders: Recorder[];
}

export default function BuggList(props: BuggListProps) {
  let router = useRouter();

  let { recorders } = props;

  let sortedRecorders = [...recorders].sort((a, b) => {
    if (a.site && !b.site) {
      return -1;
    }
    if (!a.site && b.site) {
      return 1;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <BuggDetailFlyout></BuggDetailFlyout>

      {/* Activity list (smallest breakpoint only) */}
      <div className="shadow sm:hidden mt-5">
        <ul
          role="list"
          className="mt-2 divide-y divide-gray-200 overflow-hidden shadow sm:hidden"
        >
          {sortedRecorders.map((bugg) => (
            <li
              key={bugg.deviceId}
              onClick={() => {
                router.push({
                  pathname: "/",
                  query: { bugg: bugg.deviceId, tab: router.query.tab },
                });
              }}
              className="cursor-pointer"
            >
              <div className="block px-4 py-4 bg-white hover:bg-gray-50">
                <span className="flex  items-center space-x-4">
                  <span className="flex-1 flex space-x-2 truncate">
                    <span className="flex flex-col text-gray-500 text-sm truncate">
                      <span className="truncate flex flex-row items-center">
                        {!bugg.location && (
                          <ExclamationCircleIcon
                            className="h-5 w-5 text-red-400 mr-1"
                            aria-hidden="true"
                          />
                        )}
                        {bugg.name}
                      </span>
                      <span>
                        <span className="text-gray-900 font-medium">
                          {bugg.lastUpload
                            ? formatDistance(
                                bugg.lastUpload.uploadedAt.toDate(),
                                new Date()
                              )
                            : "Never"}
                        </span>
                      </span>
                    </span>
                  </span>

                  <div className="flex flex-row justify-end">
                    <Online24HrIndicator
                      recorder={bugg}
                      width={152}
                    ></Online24HrIndicator>
                  </div>
                  <ChevronRightIcon
                    className="flex-shrink-0 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Activity table (small breakpoint and up) */}
      <div className="hidden sm:block mt-5 pb-5">
        <div className="max-w-none mx-auto">
          <div className="flex flex-col mt-2">
            <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bugg
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Upload
                    </th>
                    {/* <th className="hidden px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:table-cell lg:hidden xl:table-cell">
                      # of hours
                    </th> */}
                    {/* <th className="hidden px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:table-cell lg:hidden xl:table-cell">
                      # of files
                    </th> */}
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last 24 Hrs
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRecorders.map((bugg) => (
                    <tr
                      key={bugg.deviceId}
                      className="bg-white cursor-pointer"
                      onClick={() => {
                        router.push({
                          pathname: "/",
                          query: { bugg: bugg.deviceId, tab: router.query.tab },
                        });
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex">
                          <div className="group inline-flex space-x-2 truncate text-sm">
                            <div className="flex-shrink-0">
                              {!bugg.location && (
                                <ExclamationCircleIcon
                                  className="h-5 w-5 text-red-400 mr-1"
                                  aria-hidden="true"
                                />
                              )}

                              {bugg.location && (
                                <>
                                  {isLessThan24Hours(
                                    bugg.lastUpload?.uploadedAt
                                  ) ? (
                                    <img
                                      className="h-5 w-5"
                                      src="./bugg-active.svg"
                                      alt="Active"
                                    />
                                  ) : (
                                    <img
                                      className="h-5 w-5"
                                      src="./bugg-inactive.svg"
                                      alt="Inactive"
                                    />
                                  )}
                                </>
                              )}
                            </div>

                            <p className="text-gray-500 truncate group-hover:text-gray-900">
                              {bugg.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">
                        <span className="text-gray-900 font-medium">
                          {bugg.lastUpload
                            ? formatDistance(
                                bugg.lastUpload.uploadedAt.toDate(),
                                new Date(),
                                {
                                  addSuffix: true,
                                }
                              )
                            : "Never"}
                        </span>
                      </td>
                      {/* <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:table-cell lg:hidden xl:table-cell">
                        <span
                          className={classNames(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                          )}
                        >
                          {recorderHoursMatrix[bugg.deviceId]?.hours}
                        </span>
                      </td> */}

                      {/* <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:table-cell lg:hidden xl:table-cell">
                        <span
                          className={classNames(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                          )}
                        >
                          {recorderHoursMatrix[bugg.deviceId]?.files}
                        </span>
                      </td> */}
                      <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-row justify-end">
                          <Online24HrIndicator
                            recorder={bugg}
                            width={120}
                          ></Online24HrIndicator>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function isLessThan24Hours(timestamp?: Timestamp) {
  if (!timestamp) {
    return false;
  }

  if (timestamp.toDate().getTime() < new Date().getTime() - 86400000) {
    return false;
  }

  return true;
}
