import { ExclamationCircleIcon } from "@heroicons/react/outline";

const AccessDenied = () => (
  <div className="flex items-center justify-center w-full h-full bg-white">
    <div className="flex bg-bgravel-100 items-center px-6 py-4 text-sm border-t-2 rounded-b shadow-sm border-red-500">
      <ExclamationCircleIcon className="h-8 w-8 text-red-500"/>
      <div className="ml-3">
        <div className="font-bold text-left text-black dark:text-gray-50">
          Access denied
        </div>
        <div className="w-full text-gray-900 dark:text-gray-300 mt-1">
          You don&#x27;t have access to this page.
        </div>
      </div>
    </div>
  </div>
);

export default AccessDenied;
