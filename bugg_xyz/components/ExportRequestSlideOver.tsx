import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import {
  addDoc,
  collection,
  getFirestore,
  Timestamp,
} from "firebase/firestore";
import { Fragment, useCallback, useEffect, useReducer } from "react";
import { useProjectId } from "../data/useProjects";
import { ExportJob } from "../types";

interface FormState {
  from: Date | null;
  to: Date | null;
  type: "audio" | "detections";
  loading: boolean;
}

const initialState: FormState = {
  type: "detections",
  from: null,
  to: null,
  loading: false,
};

function reducer(state: FormState, action: any) {
  switch (action.type) {
    case "change": {
      return Object.assign({}, state, action.item);
    }
    case "reset": {
      return Object.assign({}, initialState);
    }
    default:
      throw new Error();
  }
}

export default function ExportRequestSlideOver(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  let { open, setOpen } = props;
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "reset" });
  }, [open, dispatch]);

  let currentProject = useProjectId();
  let onSubmit = useCallback(async () => {
    if (!currentProject) {
      console.error("currentProject not set??");
      return;
    }

    dispatch({ type: "change", item: { loading: true } });

    try {
      let job: ExportJob = {
        createdAt: Timestamp.now(),
        projectId: currentProject,
        status: "CREATED",
        type: state.type,
      };

      if (state.from) {
        job.from = Timestamp.fromDate(state.from);
      }

      if (state.to) {
        job.to = Timestamp.fromDate(state.to);
      }
      await addDoc(collection(getFirestore(), "exports"), job);

      setOpen(false);
      dispatch({ type: "change", item: { loading: false } });
    } catch (e) {
      alert((e as any).message);
      dispatch({ type: "change", item: { loading: false } });
    }
  }, [state, setOpen, currentProject]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="z-20 fixed inset-0 overflow-hidden"
        onClose={setOpen}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0" />

          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-700"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="pointer-events-auto w-screen max-w-md">
                <form className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="py-6 bg-[#e47c54] px-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">
                          Create Export
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={() => setOpen(false)}
                          >
                            <span className="sr-only">Close panel</span>
                            <XIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-200 px-4 sm:px-6">
                        <div className="space-y-6 pt-6 pb-5">
                          <div>
                            <label
                              htmlFor="from"
                              className="block text-sm font-medium text-gray-900"
                            >
                              Start Date
                            </label>
                            <p
                              id="privacy-public-description"
                              className="text-gray-500 text-sm"
                            >
                              Optional. The date to start the export from.
                            </p>
                            <div className="mt-1">
                              <input
                                type="date"
                                name="from"
                                id="from"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-borange focus:ring-borange sm:text-sm"
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(event) =>
                                  dispatch({
                                    type: "change",
                                    item: { from: event.target.valueAsDate },
                                  })
                                }
                                value={state.from?.toISOString().split("T")[0]}
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="to"
                              className="block text-sm font-medium text-gray-900"
                            >
                              End Date
                            </label>
                            <p
                              id="privacy-public-description"
                              className="text-gray-500 text-sm"
                            >
                              Optional. The date to end the export.
                            </p>
                            <div className="mt-1">
                              <input
                                type="date"
                                name="to"
                                id="to"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-borange focus:ring-borange sm:text-sm"
                                onChange={(event) =>
                                  dispatch({
                                    type: "change",
                                    item: { to: event.target.valueAsDate },
                                  })
                                }
                                min={
                                  state.from
                                    ? state.from?.toISOString().split("T")[0]
                                    : null
                                }
                                max={new Date().toISOString().split("T")[0]}
                                value={state.to?.toISOString().split("T")[0]}
                              />
                            </div>
                          </div>

                          <fieldset
                            onChange={(ev) =>
                              dispatch({
                                type: "change",
                                item: { type: (ev.target as any).value },
                              })
                            }
                          >
                            <legend className="text-sm font-medium text-gray-900">
                              Type
                            </legend>
                            <div className="mt-2 space-y-5">
                              <div className="relative flex items-start">
                                <div className="absolute flex h-5 items-center">
                                  <input
                                    id="just-detections"
                                    name="type"
                                    aria-describedby="just-detections-description"
                                    type="radio"
                                    value={"detections"}
                                    className="h-4 w-4 border-gray-300 text-borange focus:ring-borange"
                                    defaultChecked
                                  />
                                </div>
                                <div className="pl-7 text-sm">
                                  <label
                                    htmlFor="just-detections"
                                    className="font-medium text-gray-900"
                                  >
                                    Just detections
                                  </label>
                                  <p
                                    id="just-detections-description"
                                    className="text-gray-500"
                                  >
                                    Includes only audio records that have
                                    detections
                                  </p>
                                </div>
                              </div>
                              <div>
                                <div className="relative flex items-start">
                                  <div className="absolute flex h-5 items-center">
                                    <input
                                      id="all-audio"
                                      name="type"
                                      aria-describedby="all-audio-description"
                                      type="radio"
                                      value={"audio"}
                                      className="h-4 w-4 border-gray-300 text-borange focus:ring-borange"
                                    />
                                  </div>
                                  <div className="pl-7 text-sm">
                                    <label
                                      htmlFor="all-audio"
                                      className="font-medium text-gray-900"
                                    >
                                      All audio
                                    </label>
                                    <p id="all-audio" className="text-gray-500">
                                      Exports audio records both with and
                                      without detections.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </fieldset>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 justify-end px-4 py-4">
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-borange focus:ring-offset-2"
                      onClick={() => setOpen(false)}
                      disabled={state.loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-borange py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-borange focus:outline-none focus:ring-2 focus:ring-borange focus:ring-offset-2"
                      onClick={onSubmit}
                      disabled={state.loading}
                    >
                      Export
                    </button>
                  </div>
                </form>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
