import React, { useEffect, useState, useRef } from "react";
import { Profile } from "../../types";
import { XIcon } from "@heroicons/react/outline";

const ProfileModal = (props: {
  onClose: () => void;
  projects: string[];
  profileDetails: Profile | null;
  updateProfile: (
    displayName: string,
    isAdmin: boolean,
    selectedProjects: string[]
  ) => void;
  isEditMode: boolean;
}) => {
  const { onClose, projects, profileDetails, updateProfile, isEditMode } =
    props;
  const [name, setDisplayName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profileDetails) {
      setDisplayName(profileDetails.displayName);
      setIsAdmin(profileDetails.isAdmin);
      setSelectedProjects(profileDetails.projects || []);
    } else {
      setDisplayName("");
      setIsAdmin(false);
      setSelectedProjects([]);
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
  }, [profileDetails]);

  const toggleProject = (project: string) => {
    setSelectedProjects((prev) =>
      prev.includes(project)
        ? prev.filter((p) => p !== project)
        : [...prev, project]
    );
  };

  const handleSave = () => {
    if (isEditMode && profileDetails) {
      updateProfile(name, isAdmin, selectedProjects);
    }
    onClose();
  };

  const renderExtraDetails = (profileDetails: Profile | null) => {
    const createdAt = profileDetails?.createdAt
      ? new Date(profileDetails.createdAt.toDate()).toLocaleString()
      : "N/A";

    return (
      <div className="text-sm text-gray-700">
        <span className="font-medium">Created At:</span>
        <span className="ml-4">{createdAt}</span>
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
            {isEditMode ? "Edit Profile" : "View Profile"}
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
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!isEditMode}
              required
            />
          </div>
          <div className="mb-4 flex items-center">
            <label className="block text-sm font-medium text-gray-700">
              Is Admin:
            </label>
            <input
              type="checkbox"
              className="h-5 w-5 text-borange focus:ring-borange focus:border-borange rounded-md ml-4"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              disabled={!isEditMode}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projects
            </label>
            <div className="flex flex-wrap max-h-52 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project}
                  className={`cursor-pointer text-sm m-1 px-3 py-2 border rounded-full ${
                    selectedProjects.includes(project)
                      ? "bg-borange text-white"
                      : "bg-white text-gray-700"
                  }`}
                  onClick={() => isEditMode && toggleProject(project)}
                  style={{ pointerEvents: isEditMode ? "auto" : "none" }}
                >
                  {project}
                </div>
              ))}
            </div>
          </div>
          <div>{renderExtraDetails(profileDetails)}</div>
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

export default ProfileModal;
