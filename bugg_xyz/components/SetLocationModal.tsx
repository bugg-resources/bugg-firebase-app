/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import { LocationMarkerIcon } from "@heroicons/react/solid";
import { doc, GeoPoint, getFirestore, updateDoc } from "firebase/firestore";
import { Fragment, useCallback, useState } from "react";
import { useProjectId } from "../data/useProjects";
import { Recorder } from "../types";

export default function SetLocationModal(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  device: Recorder | null;
}) {
  let [site, setSite] = useState(props.device?.site);
  let [latitude, setLatitude] = useState(props.device?.location?.latitude);
  let [longitude, setLongitude] = useState(props.device?.location?.longitude);

  let projectId = useProjectId();
  let submit = useCallback(
    async (ev) => {
      ev.preventDefault();

      if (!site || !latitude || !longitude || !props.device || !projectId) {
        console.log(
          "Missing",
          site,
          latitude,
          longitude,
          props.device,
          projectId
        );
        return false;
      }

      // Write location
      let update: Partial<Recorder> = {
        site: site,
        name: site,
        location: new GeoPoint(latitude!, longitude!),
      };

      let ref = doc(
        getFirestore(),
        `projects/${projectId}/recorders/${props.device?.deviceId}`
      );
      await updateDoc(ref, update);
      props.setOpen(false);

      return false;
    },
    [site, latitude, longitude, props.device, projectId, props.setOpen]
  );

  return (
    <Transition.Root show={props.open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-30 inset-0 overflow-y-auto"
        onClose={props.setOpen}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                  <LocationMarkerIcon
                    className="h-6 w-6 text-borange"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900"
                  >
                    Set Location
                  </Dialog.Title>

                  <form className="space-y-3 mt-4" onSubmit={submit}>
                    <div>
                      <label
                        htmlFor="site"
                        className="block text-sm font-medium text-gray-700  text-left px-1"
                      >
                        Site Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="site"
                          name="site"
                          type="text"
                          required
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-borange focus:border-borange sm:text-sm"
                          value={site}
                          onChange={(ev) => setSite(ev.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="latitude"
                        className="block text-sm font-medium text-gray-700  text-left px-1"
                      >
                        Latitude
                      </label>
                      <div className="mt-1">
                        <input
                          id="latitude"
                          name="latitude"
                          type="number"
                          step="any"
                          placeholder="0.0000"
                          required
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-borange focus:border-borange sm:text-sm"
                          value={latitude}
                          onChange={(ev) =>
                            setLatitude(ev.target.valueAsNumber)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="longitude"
                        className="block text-sm font-medium text-gray-700 text-left px-1"
                      >
                        Longitude
                      </label>
                      <div className="mt-1">
                        <input
                          id="longitude"
                          name="longitude"
                          type="number"
                          step="any"
                          placeholder="0.0000"
                          required
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-borange focus:border-borange sm:text-sm"
                          value={longitude}
                          onChange={(ev) =>
                            setLongitude(ev.target.valueAsNumber)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-row">
                      <button
                        type="submit"
                        className="mr-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-borange hover:bg-borange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-400 text-base font-medium text-white hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange sm:text-sm"
                        onClick={() => props.setOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
