import React, { memo, useCallback, useMemo } from "react";
import { InteractionManager } from "react-native";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  availableRecordersAtom,
  selectedRecorderIdsAtom,
} from "../data/useApplication";
import { useSetLoading } from "./LoadingBar";
import MultiSelector from "./MultiSelector";

interface DeviceSelectorProps {}

function DeviceSelector(props: DeviceSelectorProps) {
  let [currentRecorderFilter, setCurrentRecorderFilter] = useRecoilState(
    selectedRecorderIdsAtom
  );

  let setLoading = useSetLoading();
  let onComplete = useCallback(
    (selection: any) => {
      setLoading(true);
      InteractionManager.runAfterInteractions(() => {
        setCurrentRecorderFilter(selection);
      });
    },
    [setLoading, setCurrentRecorderFilter]
  );

  let recorders = useRecoilValue(availableRecordersAtom);

  let options = useMemo(() => {
    return recorders.map((r) => ({
      value: r.deviceId,
      label: r.name,
    }));
  }, [recorders]);

  return (
    <MultiSelector
      title={"Buggs"}
      options={options}
      selected={currentRecorderFilter}
      onComplete={onComplete}
    ></MultiSelector>
  );
}

export default memo(DeviceSelector);
