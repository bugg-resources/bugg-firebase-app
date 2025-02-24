import React, { useEffect, useState, useRef } from "react";
import { XIcon } from "@heroicons/react/outline";

const NewProjectModal = (props: {
  onClose: () => void;
  analyses: string[];
  createProject: (name: string, selectedAnalyses: string[]) => void;
}) => {
  const { onClose, analyses, createProject } = props;
  const [name, setName] = useState<string>("");
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName("");
    setSelectedAnalyses([]);

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
  }, []);

  const toggleAnalysis = (analysis: string) => {
    setSelectedAnalyses((prev) =>
      prev.includes(analysis)
        ? prev.filter((a) => a !== analysis)
        : [...prev, analysis]
    );
  };

  return (
    <div className="z-50 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-md shadow-lg max-w-xs md:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="text-lg font-medium text-gray-900">New Project</h3>
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
              required
            />
          </div>
          <div>
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
                  onClick={() => toggleAnalysis(analysis)}
                >
                  {analysis}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 flex justify-end border-t">
          <button
            className="text-sm px-4 py-2 text-black rounded-md border border-gray-200 hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="text-sm px-4 py-2 bg-borange text-white rounded-md border border-gray-200 hover:bg-borange-700 ml-2"
            onClick={() => {
              createProject(name, selectedAnalyses);
              onClose();
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
