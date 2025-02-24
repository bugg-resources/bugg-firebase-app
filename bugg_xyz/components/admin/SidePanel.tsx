import {
  ClipboardListIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/outline";
import { useState } from "react";
import clsx from "clsx";

const SidePanel = (props: {
  setPage: (page: string) => void;
  currentPage: string;
}) => {
  const { currentPage, setPage } = props;
  const [isMinimized, setIsMinimized] = useState(true);

  const togglePanel = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div
      className={`relative text-white h-screen p-4 flex flex-col duration-300 shadow-lg ${
        isMinimized ? "w-20" : "w-40"
      }`}
    >
      <div className="flex flex-col">
        <button
          className="absolute -right-3 top-9 transform -translate-y-1/2 bg-white text-bgravel-100 rounded-full p-2 shadow-lg focus:outline-none focus:ring-0 border border-bgravel-100 z-50"
          onClick={togglePanel}
          aria-label={isMinimized ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isMinimized ? (
            <ChevronRightIcon className="h-3 w-3" />
          ) : (
            <ChevronLeftIcon className="h-3 w-3" />
          )}
        </button>

        <div className="mt-5">
          <div
            className={clsx(
              "flex items-center mt-5 gap-x-4 cursor-pointer rounded-md p-2",
              currentPage === "projects" && "bg-gray-700"
            )}
            onClick={() => setPage("projects")}
          >
            <ClipboardListIcon className="h-8 w-8" />
            <span className={clsx("duration-300", isMinimized && "hidden")}>
              Projects
            </span>
          </div>
          <div
            className={clsx(
              "flex items-center mt-5 gap-x-4 cursor-pointer rounded-md p-2",
              currentPage === "users" && "bg-gray-700"
            )}
            onClick={() => setPage("users")}
          >
            <UserIcon className="h-8 w-8" />
            <span className={clsx("duration-300", isMinimized && "hidden")}>
              Users
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
