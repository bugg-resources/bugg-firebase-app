import React, { useCallback, useMemo } from "react";
import { InteractionManager } from "react-native";
import { useRecoilState, useRecoilValue } from "recoil";
import { availableTagsAtom, selectedTagsAtom } from "../data/useApplication";
import { useSetLoading } from "./LoadingBar";
import MultiSelector from "./MultiSelector";

interface TagSelectorProps {}

function TagSelector(props: TagSelectorProps) {
  let [currentTagFilter, setCurrentTagFilter] = useRecoilState(
    selectedTagsAtom
  );

  let setLoading = useSetLoading();
  let onComplete = useCallback(
    (selection: any) => {
      setLoading(true);
      InteractionManager.runAfterInteractions(() => {
        setCurrentTagFilter(selection);
      });
    },
    [setLoading, setCurrentTagFilter]
  );

  let tags = useRecoilValue(availableTagsAtom);

  let options = useMemo(() => {
    return tags.map((t) => ({
      value: t,
      label: t,
    }));
  }, [tags]);

  return (
    <MultiSelector
      title={"Tags"}
      options={options}
      selected={currentTagFilter}
      onComplete={onComplete}
    ></MultiSelector>
  );
}

export default TagSelector;
