import { useMemo } from "react";
import classNames from "../classnames";
import { useConfigs } from "../data/useConfigs";
import { Project, Recorder } from "../types";
import { ChatAlt2Icon } from "@heroicons/react/solid";

interface SummaryCardsProps {
  // The number of days to give the stats for
  days: number;
  project: Project | null;
  recorders: Recorder[];
}

export default function SummaryCards(props: SummaryCardsProps) {
  let { days, project, recorders } = props;
  let configs = useConfigs();

  let { hours, counts } = useMemo(() => {
    let counts;
    if (days === 1) {
      counts = project?.counts?.["1Day"];
    } else if (days === 7) {
      counts = project?.counts?.["7Day"];
    } else {
      counts = project?.counts?.["30Day"];
    }

    if (!counts) {
      return { hours: "", counts };
    }

    let recorderIds = Object.keys(counts.files).filter((k) => k !== "_total");

    let hours = 0;

    for (let recorderId of recorderIds) {
      let recorder = recorders.find((r) => r.deviceId === recorderId);
      let config = configs?.find((c) => c.configId === recorder?.configId);
      if (recorder && config) {
        let fileCount = counts.files[recorderId];
        let secondsRecorded = fileCount * config.sensor.record_length;
        hours += secondsRecorded / 60 / 60;
      }
    }

    // round hours
    return { hours: Math.round(hours), counts };
  }, [project, configs, days, recorders]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 px-5 sm:px-0">
      {/* Files */}
      <div
        className={classNames(
          "hidden sm:block bg-white shadow rounded-lg overflow-hidden p-4 "
        )}
      >
        <div className="flex flex-row items-center">
          <img
            src="/bugg-files.svg"
            width={14}
            height={14}
            // @ts-ignore
            className={classNames("h-4 w-4", "text-gray-400")}
            aria-hidden="true"
          />
          <div className="text-sm font-semibold text-gray-500 truncate ml-2 ">
            Files
          </div>
        </div>

        <div className="flex flex-row items-end justify-between">
          {/* <div className="text-gray-400 text-sm">
            {files.previous ? `from ${files.previous}` : " "}
          </div> */}
          <div
            className={classNames(
              "mt-1 text-3xl font-semibold",
              "text-gray-900"
            )}
            style={{ color: undefined }}
          >
            {counts?.files._total}
          </div>
        </div>
      </div>

      {/* Hours */}
      <div
        className={classNames("bg-white shadow rounded-lg overflow-hidden p-4")}
      >
        <div className="flex flex-row items-center">
          <img
            src="/bugg-hours.svg"
            width={14}
            height={14}
            // @ts-ignore
            className={classNames("h-4 w-4", "text-gray-400")}
            style={{ color: undefined }}
            aria-hidden="true"
          />
          <div className="text-sm font-semibold text-gray-500 truncate ml-2 ">
            Hours
          </div>
        </div>

        <div className="flex flex-row items-end justify-between">
          {/* <div className="text-gray-400 text-sm">
            {hours.previous ? `from ${hours.previous}` : " "}
          </div> */}
          <div
            className={classNames(
              "mt-1 text-3xl font-semibold",
              "text-gray-900"
            )}
            style={{ color: undefined }}
          >
            {hours}
          </div>
        </div>
      </div>

      {/* Anomalies */}

      <div
        className={classNames("bg-white shadow rounded-lg overflow-hidden p-4")}
      >
        <div className="flex flex-row items-center">
          <img
            src="/bugg-anomaly.svg"
            width={14}
            height={14}
            // @ts-ignore
            className={classNames("h-4 w-4", "text-gray-400")}
            style={{ color: "#FF4200" }}
            aria-hidden="true"
          />
          <div className="text-sm font-semibold text-gray-500 truncate ml-2 ">
            Anomalies
          </div>
        </div>

        <div className="flex flex-row items-end justify-between">
          {/* <div className="text-gray-400 text-sm">
            {anomalies.previous ? `from ${anomalies.previous}` : " "}
          </div> */}
          <div
            className={classNames(
              "mt-1 text-3xl font-semibold",
              "text-gray-900"
            )}
            style={{ color: "#FF4200" }}
          >
            {counts?.["anomaly-detection"]}
          </div>
        </div>
      </div>

      {/* Birds */}
      <div
        className={classNames("bg-white shadow rounded-lg overflow-hidden p-4")}
      >
        <div className="flex flex-row items-center">
          <img
            src="/bugg-bird.svg"
            width={18}
            height={18}
            // @ts-ignore
            className={classNames("h-4 w-4", "text-gray-400")}
            style={{ color: "#6127E2" }}
            aria-hidden="true"
          />
          <div className="text-sm font-semibold text-gray-500 truncate ml-2 ">
            Birds
          </div>
        </div>

        <div className="flex flex-row items-end justify-between">
          {/* <div className="text-gray-400 text-sm">
            {birds.previous ? `from ${birds.previous}` : " "}
          </div> */}
          <div
            className={classNames(
              "mt-1 text-3xl font-semibold",
              "text-gray-900"
            )}
            style={{ color: "#6127E2" }}
          >
            {counts?.["birdnet-lite"]}
          </div>
        </div>
      </div>

      {/* Speech */}

      <div
        className={classNames("bg-white shadow rounded-lg overflow-hidden p-4")}
      >
        <div className="flex flex-row items-center">
          <ChatAlt2Icon
            className="h-4 w-4"
            aria-hidden="true"
            style={{ color: "#25E293" }}
          />

          <div className="text-sm font-semibold text-gray-500 truncate ml-2 ">
            Speech
          </div>
        </div>

        <div className="flex flex-row items-end justify-between">
          {/* <div className="text-gray-400 text-sm">
            {birds.previous ? `from ${birds.previous}` : " "}
          </div> */}
          <div
            className={classNames(
              "mt-1 text-3xl font-semibold",
              "text-gray-900"
            )}
            style={{ color: "#25E293" }}
          >
            {counts?.["speech-detection-pyannote"]}
          </div>
        </div>
      </div>
    </div>
  );
}
