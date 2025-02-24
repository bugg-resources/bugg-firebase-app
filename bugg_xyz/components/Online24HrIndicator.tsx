import { subHours } from "date-fns";
import startOfHour from "date-fns/startOfHour";
import { useEffect, useState } from "react";
import classNames from "../classnames";
import { useProjectId } from "../data/useProjects";
import { Recorder } from "../types";

const onColour = "#25E293";
const offColour = "#B7BBC8";

interface Online24HrIndicatorProps {
  width: number;

  recorder: Recorder;
}

type Status24hr = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean
];

export default function Online24HrIndicator(props: Online24HrIndicatorProps) {
  let { width, recorder } = props;

  let [status, setStatus] = useState(null as null | Status24hr);
  let projectId = useProjectId();

  useEffect(() => {
    if (!recorder || !projectId || !recorder.audioCount) {
      return;
    }

    let statuses = new Array(24).fill(0) as Status24hr;
    let baseDate = startOfHour(new Date());

    for (let i = 1; i < 25; i++) {
      statuses[i - 1] =
        recorder.audioCount[subHours(baseDate, i).toISOString()] > 0
          ? true
          : false;
    }
    setStatus(statuses);
    return () => {};
  }, [projectId, setStatus]);

  if (!status) {
    return null;
  }

  return (
    <>
      <span
        className={classNames(
          "hidden sm:inline-flex lg:hidden xl:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
        )}
      >
        {status.reduce((prev, curr) => (curr ? prev + 1 : prev), 0)}/24
      </span>
      <svg viewBox="0 0 538 129" width={width} height={width * (129 / 538)}>
        <g>
          <path
            fill={status[0] ? onColour : offColour}
            d="M24,24c-0.1,27.7-0.1,55.3,0,83c5.3,0.1,10.7,0.1,16,0c0-27.7,0-55.3,0-83C34.7,23.9,29.3,23.9,24,24z"
          />
          <path
            fill={status[1] ? onColour : offColour}
            d="M46,24.2c-0.3,3.7-0.1,7.4-0.2,11.1c0,23.9,0,47.7,0,71.6c5,0.1,10,0.1,15,0c0.1-27.7,0.1-55.3,0-83
       C56,24,50.9,23.5,46,24.2z"
          />
          <path
            fill={status[2] ? onColour : offColour}
            d="M82.1,24.1c-5-0.2-10-0.2-14.9-0.1c-0.1,27.7-0.1,55.3,0,83c5,0.1,10,0.1,15,0C82,79.3,82,51.7,82.1,24.1z"
          />
          <path
            fill={status[3] ? onColour : offColour}
            d="M87.2,24c-0.1,27.7-0.1,55.3,0,83c5.3,0.1,10.7,0.1,16,0c0-27.7,0.1-55.3,0-83C97.8,23.9,92.5,23.9,87.2,24z"
          />
          <path
            fill={status[4] ? onColour : offColour}
            d="M108.3,24.3c-0.3,3.7-0.1,7.4-0.1,11.1c0,23.8,0,47.7,0,71.6c5,0.1,10,0.1,15,0c0.1-27.6,0.1-55.3,0-83
       C118.2,24,113.1,23.5,108.3,24.3z"
          />
          <path
            fill={status[5] ? onColour : offColour}
            d="M144.3,24.1c-5-0.3-9.9-0.2-14.9-0.1c-0.1,27.7-0.1,55.3,0,83c5,0.1,9.9,0.1,14.9,0
       C144.2,79.3,144.2,51.7,144.3,24.1z"
          />
          <path
            fill={status[6] ? onColour : offColour}
            d="M149.4,24c-0.1,27.7-0.1,55.3,0,83c5.3,0.1,10.7,0.1,16,0c0-27.7,0.1-55.3,0-83C160,23.9,154.7,23.9,149.4,24z"
          />
          <path
            fill={status[7] ? onColour : offColour}
            d="M170.6,24.3c-0.3,4-0.1,8-0.1,12c0,23.5,0,47.1,0,70.6c5,0.1,9.9,0.1,14.9,0c0.1-27.6,0.1-55.3,0-83
       C180.4,24,175.3,23.5,170.6,24.3z"
          />
          <path
            fill={status[8] ? onColour : offColour}
            d="M206.5,24.1c-4.9-0.1-9.9-0.5-14.7,0.1c-0.3,2.1-0.3,4.3-0.3,6.5c0.1,25.4-0.1,50.9,0.1,76.3
       c5,0.1,10,0.1,14.9,0C206.5,79.3,206.5,51.7,206.5,24.1z"
          />
          <path
            fill={status[9] ? onColour : offColour}
            d="M211.5,24c-0.1,27.7-0.1,55.3,0,83c5.3,0.1,10.7,0.1,16,0c0.1-27.7,0.1-55.3,0-83
       C222.2,23.9,216.9,23.9,211.5,24z"
          />
          <path
            fill={status[10] ? onColour : offColour}
            d="M232.7,24.3c-0.3,4-0.1,8-0.1,12c0,23.5,0,47.1,0,70.6c5,0.1,10,0.1,15,0c0.1-27.7,0.1-55.3,0-83
       C242.7,24,237.6,23.5,232.7,24.3z"
          />
          <path
            fill={status[11] ? onColour : offColour}
            d="M254,24.2c-0.3,2.1-0.3,4.3-0.3,6.5c0.1,25.4-0.1,50.9,0.1,76.3c5,0.1,10,0.1,15,0c0-27.6,0-55.3,0-82.9
       C263.9,24,258.9,23.5,254,24.2z"
          />
          <path
            fill={status[12] ? onColour : offColour}
            d="M273.7,24c-0.1,27.7,0,55.3,0,83c5.3,0.1,10.7,0.1,16,0c0.1-27.7,0.1-55.3,0-83
       C284.4,23.9,279.1,23.9,273.7,24z"
          />
          <path
            fill={status[13] ? onColour : offColour}
            d="M295,24.3c-0.3,3.7-0.1,7.4-0.1,11.1c0,23.8,0,47.7,0,71.5c5,0.1,9.9,0.1,14.9,0c0.1-27.7,0.1-55.3,0-83
       C304.9,24,299.8,23.5,295,24.3z"
          />
          <path
            fill={status[14] ? onColour : offColour}
            d="M316.2,24.2c-0.4,2.7-0.3,5.6-0.3,8.4c0.1,24.8-0.1,49.6,0.1,74.4c5,0.1,10,0.1,15,0c0-27.6,0-55.3,0-82.9
       C326.1,24,321.1,23.5,316.2,24.2z"
          />
          <path
            fill={status[15] ? onColour : offColour}
            d="M335.9,24c-0.1,27.7,0,55.3,0,83c5.3,0.1,10.7,0.1,16,0c0.1-27.7,0.1-55.3,0-83
       C346.6,23.9,341.3,23.9,335.9,24z"
          />
          <path
            fill={status[16] ? onColour : offColour}
            d="M357.2,24c-0.1,27.7-0.1,55.3,0,83c4.9,0,9.9,0,14.8,0c0.1-27.7,0.1-55.3,0-83C367.1,23.9,362.2,23.9,357.2,24
       z"
          />
          <path
            fill={status[17] ? onColour : offColour}
            d="M378.4,24.2c-0.4,2.7-0.3,5.6-0.3,8.4c0.1,24.8-0.1,49.6,0.1,74.4c5,0.1,10,0.1,15.1,0c0-27.7,0-55.3,0-83
       C388.4,24,383.3,23.5,378.4,24.2z"
          />
          <path
            fill={status[18] ? onColour : offColour}
            d="M398.1,24c-0.1,27.7,0,55.3,0,83c5.4,0.1,10.7,0.1,16.1,0c0.1-27.7,0.1-55.3,0-83
       C408.8,23.9,403.5,23.9,398.1,24z"
          />
          <path
            fill={status[19] ? onColour : offColour}
            d="M419.4,24c-0.1,27.7-0.1,55.3,0,83c5,0,9.9,0,14.9,0c0.1-27.7,0.1-55.4,0-83C429.3,23.9,424.4,23.9,419.4,24z"
          />
          <path
            fill={status[20] ? onColour : offColour}
            d="M440.6,24.2c-0.3,2.1-0.3,4.3-0.3,6.5c0.1,25.4-0.1,50.9,0.1,76.3c5,0.1,10,0.1,15,0c0-27.6,0-55.3,0-83
       C450.6,24,445.5,23.5,440.6,24.2z"
          />
          <path
            fill={status[21] ? onColour : offColour}
            d="M460.5,24.2c-0.4,3.7-0.1,7.4-0.2,11.1c0,23.8,0,47.7,0,71.5c5.3,0.1,10.6,0.1,16,0c0.1-27.7,0.1-55.3,0-83
       C471.1,24,465.7,23.5,460.5,24.2z"
          />
          <path
            fill={status[22] ? onColour : offColour}
            d="M481.7,24c-0.1,27.7-0.1,55.3,0,83c4.9,0,9.9,0,14.8,0c0.1-27.7,0.1-55.3,0-83C491.5,23.9,486.6,23.9,481.7,24
       z"
          />
          <path
            fill={status[23] ? onColour : offColour}
            d="M517.9,24c-5,0-10.1-0.5-15.1,0.2c-0.3,2.1-0.3,4.3-0.3,6.5c0.1,25.4-0.1,50.9,0.1,76.3
       c5.1,0.1,10.2,0.1,15.3,0C518,79.3,518,51.7,517.9,24z"
          />
        </g>
      </svg>
    </>
  );
}
