import { Dialog, Transition } from "@headlessui/react";
import { PencilIcon, XCircleIcon, XIcon } from "@heroicons/react/outline";
import { format } from "date-fns";
import { doc, getFirestore, onSnapshot, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import classNames from "../classnames";
import { useAllRecorders } from "../data/useRecorders";
import { Recorder, RecorderConfig } from "../types";
import { useLoadingBar } from "./LoadingBar";
import OnlineIndicator7Days from "./OnlineIndicator7Days";
import SetLocationModal from "./SetLocationModal";

interface BuggDetailFlyoutProps {}

export default function BuggDetailFlyout(props: BuggDetailFlyoutProps) {
  let router = useRouter();
  let [config, setConfig] = useState(null as null | RecorderConfig);
  let loadingBar = useLoadingBar();

  let isOpen = !!router.query.bugg;
  let bugg = router.query.bugg;
  let tab = router.query.tab;

  let recorders = useAllRecorders();
  let devices = recorders.filter((r) => r.deviceId === bugg);
  let device = devices.length === 1 ? devices[0] : null;

  let active = isLessThan24Hours(device?.lastUpload?.uploadedAt);

  useEffect(() => {
    if (!device) {
      return;
    }
    loadingBar.start();

    let ref = doc(getFirestore(), `config/${device.configId}`);

    let unsub = onSnapshot(ref, (snap) => {
      loadingBar.complete();
      let incomming = snap.data() as RecorderConfig;
      setConfig(incomming);
    });

    return () => {
      unsub();
      setConfig(null);
    };
  }, [device, setConfig, loadingBar]);

  let close = useCallback(() => {
    router.push({
      pathname: "/",
      query: { tab: tab },
    });
  }, [router, tab]);

  let hasLocation = !!device?.location;

  const tabs = useMemo(() => {
    return [
      {
        name: "Status",
        href: `/?bugg=${bugg}`,
        current: !tab || tab === "status",
      },
      {
        name: "Detail",
        href: `/?bugg=${bugg}&tab=detail`,
        current: tab === "detail",
      },
      {
        name: "Stream",
        href: `/?bugg=${bugg}&tab=stream`,
        current: tab === "stream",
      },
      {
        name: "Location",
        href: `/?bugg=${bugg}&tab=location`,
        current: tab === "location",
        badge: !hasLocation,
      },
    ].filter(Boolean);
  }, [bugg, tab, hasLocation]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden z-30"
        onClose={close}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0" />

          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
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
                <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                  <div className="px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="flex flex-col">
                        <span className="text-lg font-semibold text-gray-900 inline-flex items-center">
                          {active ? (
                            <img
                              className="h-5 w-5 mr-2"
                              src="./bugg-active.svg"
                              alt="Active"
                            />
                          ) : (
                            <img
                              className="h-5 w-5 mr-2"
                              src="./bugg-inactive.svg"
                              alt="Inactive"
                            />
                          )}
                          {device?.name}
                        </span>
                      </Dialog.Title>

                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-borange focus:ring-offset-2"
                          onClick={close}
                        >
                          <span className="sr-only">Close panel</span>
                          <XIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 mt-6">
                    <div className="px-6">
                      <nav
                        className="-mb-px flex space-x-6"
                        x-descriptions="Tab component"
                      >
                        {tabs.map((tabItem) => (
                          <Link
                            key={tabItem.href}
                            href={tabItem.href}
                            replace={true}
                          >
                            <a
                              key={tabItem.name}
                              className={classNames(
                                tabItem.current
                                  ? "border-borange text-borange"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                                "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm relative"
                              )}
                            >
                              {tabItem.name}

                              {tabItem.badge && (
                                <span
                                  className={classNames(
                                    "bg-red-400",
                                    "absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full ring-2 ring-white"
                                  )}
                                  aria-hidden="true"
                                />
                              )}
                            </a>
                          </Link>
                        ))}
                      </nav>
                    </div>
                  </div>

                  {(!tab || tab === "status") && (
                    <StatusTabPage device={device}></StatusTabPage>
                  )}
                  {tab === "detail" && (
                    <OverviewTabPage
                      device={device}
                      config={config}
                    ></OverviewTabPage>
                  )}
                  {tab === "stream" && (
                    <StreamTabPage device={device}></StreamTabPage>
                  )}
                  {tab === "location" && (
                    <LocationTabPage device={device}></LocationTabPage>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function OverviewTabPage(props: {
  device: Recorder | null;
  config: RecorderConfig | null;
}) {
  if (!props.device || !props.config) {
    return null;
  }
  return (
    <div className="relative mt-0 flex-1 p-4 sm:p-6 bg-white">
      <div className="absolute inset-0 p-4 sm:p-6">
        {/* Info */}
        <div>
          <h3 className="font-medium text-gray-900 mt-1">Details</h3>
          <dl className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200">
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">Device</dt>
              <dd className="text-gray-900">{props.device?.deviceId}</dd>
            </div>
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">First Seen</dt>
              <dd className="text-gray-900">
                {" "}
                {format(props.device.createdAt.toDate(), "do MMM yyyy")}
              </dd>
            </div>
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">Last Upload</dt>
              {props.device.lastUpload && (
                <dd className="text-gray-900">
                  {format(
                    props.device.lastUpload.uploadedAt.toDate(),
                    "HH:mm do MMM yyyy"
                  )}
                </dd>
              )}
            </div>
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">Config</dt>
              <dd className="text-gray-900">
                {props.device?.configId && (
                  <Link href={`/configuration?config=${props.device.configId}`}>
                    <a className="underline decoration-borange text-borange">
                      {props.device.configId}
                    </a>
                  </Link>
                )}
              </dd>
            </div>
          </dl>

          <h3 className="font-medium text-gray-900 mt-9">
            Mobile Internet APN
          </h3>
          <dl className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200">
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">APN</dt>
              <dd className="text-gray-900">
                {props.config.mobile_network.hostname}
              </dd>
            </div>
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">User</dt>
              <dd className="text-gray-900">
                {props.config.mobile_network.username}
              </dd>
            </div>
          </dl>

          <h3 className="font-medium text-gray-900 mt-9">
            Recording Parameters
          </h3>
          <dl className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200">
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">Sample Rate</dt>
              <dd className="text-gray-900">
                {props.config.sensor.record_freq} Hz
              </dd>
            </div>
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">Recording Length</dt>
              <dd className="text-gray-900">
                {props.config.sensor.record_length} sec
              </dd>
            </div>
            <div className="flex justify-between py-3 text-sm font-medium">
              <dt className="text-gray-500">Recordinging Interval</dt>
              <dd className="text-gray-900">
                {props.config.sensor.capture_delay} sec
              </dd>
            </div>
          </dl>

          <div className="h-9"></div>
        </div>
        {/* /Info */}
      </div>
    </div>
  );
}

function LocationTabPage(props: { device: Recorder | null }) {
  let [open, setOpen] = useState(false);

  return (
    <div className="relative mt-0 flex-1 p-4 sm:p-6 bg-white">
      <SetLocationModal
        key={`${open}`}
        open={open}
        setOpen={setOpen}
        device={props.device}
      ></SetLocationModal>
      <div className="absolute inset-0 p-4 sm:p-6 ">
        {!props.device?.location && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon
                  className="h-5 w-5 text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Location not set
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Set a location to begin processing audio.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-row justify-between items-end">
          <h3 className="font-medium text-gray-900">Location</h3>
          <button
            type="button"
            className="-mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-borange"
            onClick={() => setOpen(true)}
          >
            <PencilIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Edit Location</span>
          </button>
        </div>

        <dl className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200">
          <div className="flex justify-between py-3 text-sm font-medium">
            <dt className="text-gray-500">Site</dt>
            <dd className="text-gray-900">{props.device?.site}</dd>
          </div>
          <div className="flex justify-between py-3 text-sm font-medium">
            <dt className="text-gray-500">Latitude</dt>
            <dd className="text-gray-900">
              {props.device?.location?.latitude}
            </dd>
          </div>
          <div className="flex justify-between py-3 text-sm font-medium">
            <dt className="text-gray-500">Longitude</dt>
            <dd className="text-gray-900">
              {props.device?.location?.longitude}
            </dd>
          </div>
        </dl>

        <div className="h-9"></div>
      </div>
    </div>
  );
}

function StatusTabPage(props: { device: Recorder | null }) {
  return (
    <div className="relative mt-0 flex-1 p-4 sm:p-6 bg-white">
      <div className="absolute inset-0 p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 mt-1">Last 7 Days</h3>
        {props.device && props.device.location && (
          <OnlineIndicator7Days recorder={props.device}></OnlineIndicator7Days>
        )}

        <div className="h-9"></div>
      </div>
    </div>
  );
}

function StreamTabPage(props: { device: Recorder | null }) {
  return (
    <div className="relative mt-0 flex-1 p-4 sm:p-6 bg-white">
      <div className="absolute inset-0">
        <div className="text-center mt-32">
          <div className="flex items-center justify-center opacity-40">
            <img src={"/bugg-play.svg"} width={42} height={42} />
          </div>
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            Recent Audio
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            View this recorder in Streams
          </p>
          <div className="mt-6">
            <Link href={`/stream?bugg=${props.device?.deviceId}`}>
              <a
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-borange hover:bg-borange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange"
              >
                Open
              </a>
            </Link>
          </div>
        </div>

        <div className="h-9"></div>
      </div>
    </div>
  );
}

function isLessThan24Hours(timestamp?: Timestamp) {
  if (!timestamp) {
    return false;
  }

  if (timestamp.toDate().getTime() < new Date().getTime() - 86400000) {
    return false;
  }

  return true;
}
