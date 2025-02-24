import React, { useEffect, useRef } from "react";
import { XIcon } from "@heroicons/react/outline";

const ConfirmationModal = (props: {
  title: string;
  text: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { title, text, onClose, onConfirm } = props;
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  return (
    <div className="z-50 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-md shadow-lg max-w-xs md:max-w-md lg:max-w-lg"
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
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
          <p className="text-sm text-gray-700">{text}</p>
        </div>
        <div className="p-4 flex justify-end">
          <button
            className="text-sm px-4 py-2 text-black rounded-md border border-gray-200 hover:bg-gray-100"
            onClick={onClose}
          >
            No, Cancel
          </button>
          <button
            className="text-sm px-4 py-2 bg-red-600 text-white rounded-md border border-gray-200 hover:bg-red-800 ml-2"
            onClick={onConfirm}
          >
            Yes, I&apos;m sure
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
