import React, { memo } from "react";
import { useRecoilValue } from "recoil";
import { availableAnalysesAtom } from "../data/useApplication";
import AnalysisCard from "./AnalysisCard";

interface AnalysisCardSetProps {}

function AnalysisCardSet(props: AnalysisCardSetProps) {
  let availableAnalyses = useRecoilValue(availableAnalysesAtom);
  return (
    <>
      {availableAnalyses.map((a) => (
        <AnalysisCard key={a.id} analysis={a}></AnalysisCard>
      ))}
    </>
  );
}

export default memo(AnalysisCardSet);
