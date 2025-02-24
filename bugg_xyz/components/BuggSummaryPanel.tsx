import { useProject } from "../data/useProjects";
import { useAllRecorders } from "../data/useRecorders";
import BuggList from "./BuggList";
import SummaryCards from "./SummaryCards";

interface BuggSummaryPanelProps {
  // The number of days to give the stats for
  days: number;
}

export default function BuggSummaryPanel(props: BuggSummaryPanelProps) {
  let project = useProject();
  let recorders = useAllRecorders();

  return (
    <div>
      <SummaryCards
        days={props.days}
        project={project}
        recorders={recorders}
      ></SummaryCards>
      <BuggList recorders={recorders}></BuggList>
    </div>
  );
}
