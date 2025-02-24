import React, { useEffect, useState, useRef } from "react";
import { XIcon } from "@heroicons/react/outline";
import { Project } from "../../types";

const ProjectModal = (props: {
  onClose: () => void;
  analyses: string[];
  projectDetails: Project | null;
  updateProject: (name: string, selectedAnalyses: string[]) => void;
  isEditMode: boolean;
}) => {
  const { onClose, analyses, projectDetails, updateProject, isEditMode } =
    props;
  const [name, setName] = useState("");
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectDetails) {
      setName(projectDetails.name);
      setSelectedAnalyses(projectDetails.analyses);
    } else {
      setName("");
      setSelectedAnalyses([]);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [projectDetails]);

  const toggleAnalysis = (analysis: string) => {
    setSelectedAnalyses((prev) =>
      prev.includes(analysis)
        ? prev.filter((a) => a !== analysis)
        : [...prev, analysis]
    );
  };

  const handleSave = () => {
    if (isEditMode && projectDetails) {
      updateProject(name, selectedAnalyses);
    }
    onClose();
  };

  const renderSummaryData = (projectDetails: Project | null) => {
    const audioCount = projectDetails?.audioCount ?? 0;
    const oneDayFilesTotal =
      projectDetails?.counts?.["1Day"]?.files?._total ?? 0;
    const sevenDayFilesTotal =
      projectDetails?.counts?.["7Day"]?.files?._total ?? 0;
    const thirtyDayFilesTotal =
      projectDetails?.counts?.["30Day"]?.files?._total ?? 0;

    const detectionCount = projectDetails?.detectionCount ?? 0;
    const lastStatsUpdate = projectDetails?.lastStatsUpdate ?? "";

    return (
      <div className="p-2 text-sm font-medium text-gray-700">
        <div className="mb-2">
          <span>Audio count: </span>
          <span className="ml-4">{audioCount}</span>
        </div>
        <div className="mb-2">
          <span>1 day files total: </span>
          <span className="ml-4">{oneDayFilesTotal}</span>
        </div>
        <div className="mb-2">
          <span>7 day files total: </span>
          <span className="ml-4">{sevenDayFilesTotal}</span>
        </div>
        <div className="mb-2">
          <span>30 day files total: </span>
          <span className="ml-4">{thirtyDayFilesTotal}</span>
        </div>
        <div className="mb-2">
          <span>Detection count: </span>
          <span className="ml-4">{detectionCount}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="z-50 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-md shadow-lg max-w-xs md:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditMode ? "Edit Project" : "View Project"}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-6 h-6 ms-auto inline-flex justify-center items-center"
            onClick={onClose}
          >
            <XIcon />
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              className="bg-gray-50 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-borange focus:border-borange sm:text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditMode}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis
            </label>
            <div className="flex flex-wrap max-h-52 overflow-y-auto">
              {analyses.map((analysis) => (
                <div
                  key={analysis}
                  className={`cursor-pointer text-sm m-1 px-3 py-2 border rounded-full ${
                    selectedAnalyses.includes(analysis)
                      ? "bg-borange text-white"
                      : "bg-white text-gray-700"
                  }`}
                  onClick={() => isEditMode && toggleAnalysis(analysis)}
                  style={{ pointerEvents: isEditMode ? "auto" : "none" }}
                >
                  {analysis}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary
            </label>
            <div>{renderSummaryData(projectDetails)}</div>
          </div>
        </div>
        <div className="p-4 flex justify-end border-t">
          <button
            className="text-sm px-4 py-2 text-black rounded-md border border-gray-200 hover:bg-gray-100"
            onClick={onClose}
          >
            Close
          </button>
          {isEditMode && (
            <button
              className="text-sm px-4 py-2 bg-borange text-white rounded-md border border-gray-200 hover:bg-borange-700 ml-2"
              onClick={handleSave}
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
