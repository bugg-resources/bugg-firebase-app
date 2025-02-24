import {
  ClockIcon,
  MicrophoneIcon,
  SwitchVerticalIcon,
} from "@heroicons/react/outline";
import {
  addDoc,
  doc,
  getFirestore,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { Field, Form, Formik, useFormikContext } from "formik";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import * as Yup from "yup";
import classNames from "../classnames";
import NavBar from "../components/NavBar";
import NavHeader from "../components/NavHeader";
import { generateConfigId, downloadConfig } from "../data/configUtil";
import { useProjectId } from "../data/useProjects";
import { RecorderConfig } from "../types";
import { useConfigs } from "../data/useConfigs";

interface FormState {
  awake_times: {
    "00:00": boolean;
    "01:00": boolean;
    "02:00": boolean;
    "03:00": boolean;
    "04:00": boolean;
    "05:00": boolean;
    "06:00": boolean;
    "07:00": boolean;
    "08:00": boolean;
    "09:00": boolean;
    "10:00": boolean;
    "11:00": boolean;
    "12:00": boolean;
    "13:00": boolean;
    "14:00": boolean;
    "15:00": boolean;
    "16:00": boolean;
    "17:00": boolean;
    "18:00": boolean;
    "19:00": boolean;
    "20:00": boolean;
    "21:00": boolean;
    "22:00": boolean;
    "23:00": boolean;
  };
  capture_delay: number;
  sensor_type: string;
  record_length: number;
  compress_data: boolean;
  record_freq: number;
  hostname: string;
  username: string;
  password: string;
}

const defaultValues: FormState = {
  awake_times: {
    "00:00": true,
    "01:00": true,
    "02:00": true,
    "03:00": true,
    "04:00": true,
    "05:00": true,
    "06:00": true,
    "07:00": true,
    "08:00": true,
    "09:00": true,
    "10:00": true,
    "11:00": true,
    "12:00": true,
    "13:00": true,
    "14:00": true,
    "15:00": true,
    "16:00": true,
    "17:00": true,
    "18:00": true,
    "19:00": true,
    "20:00": true,
    "21:00": true,
    "22:00": true,
    "23:00": true,
  },
  capture_delay: 0,
  sensor_type: "I2SMic",
  record_length: 300,
  compress_data: true,
  record_freq: 44100,
  hostname: "",
  username: "",
  password: "",
};

const FormSchema = Yup.object().shape({
  capture_delay: Yup.number()
    .integer("Should be a round number")
    .required("Required")
    .min(0, "Min allowed is 0")
    .typeError("You must specify a number"),
  sensor_type: Yup.string().required("Required").is(["I2SMic"]),
  record_length: Yup.number()
    .integer("Should be a round number")
    .required("Required")
    .min(1, "Must be positive")
    .max(3600, "Max allowed is 3600 (1 hour)")
    .typeError("You must specify a number"),
  compress_data: Yup.boolean().required("Required"),
  record_freq: Yup.number()
    .integer("Should be a round number")
    .required("Required")
    .min(1000, "Min allowed is 1000")
    .max(160000, "Max allowed is 160,000")
    .typeError("You must specify a number"),
  hostname: Yup.string().required("Required").typeError("Required"),
  username: Yup.string().required("Required").typeError("Required"),
  password: Yup.string().required("Required").typeError("Required"),
});

async function toConfig(
  projectId: string,
  values: FormState
): Promise<RecorderConfig> {
  let conf: any = {
    projectId: projectId,
    sensor: {
      capture_delay: values.capture_delay,
      sensor_type: values.sensor_type,
      record_length: values.record_length,
      compress_data: values.compress_data,
      record_freq: values.record_freq,
      awake_times: Object.keys(values.awake_times).filter(
        (k) => (values.awake_times as any)[k]
      ),
    },
    mobile_network: {
      hostname: values.hostname,
      username: values.username,
      password: values.password,
    },
    recorders: [],
  };

  let configId = await generateConfigId(projectId, conf);

  conf.createdAt = Timestamp.now();
  conf.configId = configId;

  return conf;
}

const Configurations: NextPage = () => {
  let currentProjectId = useProjectId();
  let configs = useConfigs();
  let router = useRouter();
  let configId = router.query.config;
  let isCreatingNew = !configId;
  let [derrivedConfigId, setDerrivedConfigId] = useState(null as null | string);
  let configMatchesExisting =
    (configId && derrivedConfigId === null) ||
    !!configs?.find((c) => c.configId === derrivedConfigId);

  let existingConfig = useMemo(() => {
    if (isCreatingNew || !configs) {
      return null;
    }
    return configs.find((c) => c.configId === configId) || null;
  }, [configId, isCreatingNew, configs]);

  let initialValues = useMemo(() => {
    if (existingConfig) {
      return {
        configId: existingConfig.configId,
        // awake_times: existingConfig.sensor.awake_times,
        capture_delay: existingConfig.sensor.capture_delay,
        sensor_type: existingConfig.sensor.sensor_type,
        record_length: existingConfig.sensor.record_length,
        compress_data: existingConfig.sensor.compress_data,
        record_freq: existingConfig.sensor.record_freq,

        hostname: existingConfig.mobile_network.hostname,
        username: existingConfig.mobile_network.username,
        password: existingConfig.mobile_network.password,

        awake_times: {
          "00:00": existingConfig.sensor.awake_times.includes("00:00"),
          "01:00": existingConfig.sensor.awake_times.includes("01:00"),
          "02:00": existingConfig.sensor.awake_times.includes("02:00"),
          "03:00": existingConfig.sensor.awake_times.includes("03:00"),
          "04:00": existingConfig.sensor.awake_times.includes("04:00"),
          "05:00": existingConfig.sensor.awake_times.includes("05:00"),
          "06:00": existingConfig.sensor.awake_times.includes("06:00"),
          "07:00": existingConfig.sensor.awake_times.includes("07:00"),
          "08:00": existingConfig.sensor.awake_times.includes("08:00"),
          "09:00": existingConfig.sensor.awake_times.includes("09:00"),
          "10:00": existingConfig.sensor.awake_times.includes("10:00"),
          "11:00": existingConfig.sensor.awake_times.includes("11:00"),
          "12:00": existingConfig.sensor.awake_times.includes("12:00"),
          "13:00": existingConfig.sensor.awake_times.includes("13:00"),
          "14:00": existingConfig.sensor.awake_times.includes("14:00"),
          "15:00": existingConfig.sensor.awake_times.includes("15:00"),
          "16:00": existingConfig.sensor.awake_times.includes("16:00"),
          "17:00": existingConfig.sensor.awake_times.includes("17:00"),
          "18:00": existingConfig.sensor.awake_times.includes("18:00"),
          "19:00": existingConfig.sensor.awake_times.includes("19:00"),
          "20:00": existingConfig.sensor.awake_times.includes("20:00"),
          "21:00": existingConfig.sensor.awake_times.includes("21:00"),
          "22:00": existingConfig.sensor.awake_times.includes("22:00"),
          "23:00": existingConfig.sensor.awake_times.includes("23:00"),
        },
      };
    }

    return defaultValues;
  }, [existingConfig]);

  if (configId && !existingConfig) {
    // loading
    return null;
  }

  return (
    <>
      <Head>
        <title>{isCreatingNew ? "Add" : "Edit"} Configuration - Bugg</title>
        <link rel="icon" sizes="192x192" href="/favicon.png"></link>
      </Head>
      <NavBar></NavBar>

      <Formik
        initialValues={initialValues}
        validationSchema={FormSchema}
        isInitialValid={!!existingConfig}
        validate={(values) => {
          toConfig(currentProjectId!, values).then((conf) =>
            setDerrivedConfigId(conf.configId)
          );
          return;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          if (!currentProjectId) {
            console.error("Missing project ID", currentProjectId);
            return;
          }

          setSubmitting(true);
          let config = await toConfig(currentProjectId!, values);

          if (!configMatchesExisting) {
            await setDoc(
              doc(getFirestore(), `config/${config.configId}`),
              config
            );
          }

          downloadConfig(currentProjectId, config);

          router.push({
            pathname: "configurations",
          });
        }}
      >
        {({ isSubmitting, isValid }) => (
          <>
            <NavHeader
              title={isCreatingNew ? "New Configuration" : "Copy Configuration"}
            >
              {derrivedConfigId === null ||
                (derrivedConfigId === configId && (
                  <span className="text-gray-400 text-sm">{configId}</span>
                ))}
            </NavHeader>

            <main className="bg-bgrey-200 grow flex flex-col p-4 sm:p-4 md:p-8">
              <Form>
                <div className="space-y-6">
                  <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                      <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          Mobile Network
                        </h3>
                        <p className="mt-1 text-sm text-gray-500"></p>
                      </div>
                      <div className="mt-5 md:mt-0 md:col-span-2">
                        <div className="grid grid-cols-6 gap-6">
                          <div className="col-span-6 sm:col-span-4">
                            <label
                              htmlFor="hostname"
                              className="block text-sm font-medium text-gray-700"
                            >
                              APN Hostname
                            </label>
                            <Field
                              type="text"
                              name="hostname"
                              id="hostname"
                              className="mt-1 focus:ring-borange focus:border-borange block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-4 grid grid-cols-2 gap-3">
                            <div className="">
                              <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Username
                              </label>
                              <Field
                                type="text"
                                name="username"
                                id="username"
                                className="mt-1 focus:ring-borange focus:border-borange block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>

                            <div className="">
                              <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Password
                              </label>
                              <Field
                                type="text"
                                name="password"
                                id="password"
                                className="mt-1 focus:ring-borange focus:border-borange block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                      <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          Sensor Config
                        </h3>
                        <p className="mt-1 text-sm text-gray-500"></p>
                      </div>
                      <div className="mt-5 md:mt-0 md:col-span-2">
                        <div className="grid grid-cols-6 gap-6">
                          <div className="col-span-6 sm:col-span-4">
                            <fieldset className="space-y-0">
                              <legend className="sr-only">
                                Compress Audio
                              </legend>
                              <div className="relative flex items-start">
                                <div className="flex items-center h-5">
                                  <Field
                                    id="compress_data"
                                    aria-describedby="compress_data-description"
                                    name="compress_data"
                                    type="checkbox"
                                    className="focus:ring-borange h-4 w-4 text-borange border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label
                                    htmlFor="compress_data"
                                    className="font-medium text-gray-700"
                                  >
                                    Compress Audio
                                  </label>
                                  <p
                                    id="compress_data-description"
                                    className="text-gray-500"
                                  >
                                    Audio will be saved as an mp3
                                  </p>
                                </div>
                              </div>
                            </fieldset>
                          </div>

                          <div className="col-span-6 sm:col-span-4">
                            <label
                              htmlFor="record_freq"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Sample Frequency
                            </label>
                            <Field
                              type="text"
                              name="record_freq"
                              id="record_freq"
                              className="mt-1 focus:ring-borange focus:border-borange block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-4">
                            <label
                              htmlFor="record_length"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Recording Length (seconds)
                            </label>
                            <Field
                              type="text"
                              name="record_length"
                              id="record_length"
                              className="mt-1 focus:ring-borange focus:border-borange block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-4">
                            <label
                              htmlFor="capture_delay"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Recording Interval (seconds)
                            </label>
                            <Field
                              type="text"
                              name="capture_delay"
                              id="capture_delay"
                              className="mt-1 focus:ring-borange focus:border-borange block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AwakeTimes></AwakeTimes>

                  <div className="flex justify-end">
                    <Link href={"/configurations"}>
                      <a
                        type="button"
                        className={classNames(
                          "bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange",
                          isSubmitting && "opacity-70"
                        )}
                      >
                        Cancel
                      </a>
                    </Link>
                    <button
                      disabled={isSubmitting || !isValid}
                      type="submit"
                      className={classNames(
                        "ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-borange hover:bg-borange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-borange",
                        isSubmitting && "opacity-70",
                        !isValid && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {configMatchesExisting ? "" : "Save & "} Download
                    </button>
                  </div>
                </div>
              </Form>
            </main>
          </>
        )}
      </Formik>
    </>
  );
};

export default Configurations;

function AwakeTimes() {
  let { values } = useFormikContext();

  let hoursAwake = Object.keys((values as any).awake_times).filter(
    (k) => (values as any).awake_times[k]
  ).length;
  let recordingTime = `${hoursAwake}`;
  let recordingSeconds = hoursAwake * 60 * 60;

  if (
    !isNaN((values as any).record_length) &&
    !isNaN((values as any).capture_delay)
  ) {
    // @ts-ignore
    let l = parseInt(values.record_length);
    // @ts-ignore
    let d = parseInt(values.capture_delay);
    let t = Math.round((l / (d + l)) * hoursAwake);
    if (!isNaN(t)) {
      recordingTime = `${t}`;
      recordingSeconds = t * 60 * 60;
    }
  }

  let bitrate = 120;
  let dataRequired = Math.round((recordingSeconds * bitrate) / 8 / 1024);

  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Awake times
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Select the times the device is to remain powered-on
          </p>

          <div className="pl-2">
            <div>
              <div className="mt-4 flex text-sm">
                <div className="group inline-flex items-center text-gray-500 ">
                  <ClockIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <span className="ml-2">Awake for</span>
                  <span className="font-bold ml-1">{hoursAwake}hrs</span>
                </div>
              </div>
            </div>
            <div className="">
              <div className="mt-4 flex text-sm">
                <div className="group inline-flex items-center text-gray-500 ">
                  <MicrophoneIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <span className="ml-2">Recording</span>
                  <span className="font-bold ml-1">{recordingTime} hrs</span>
                </div>
              </div>
            </div>
            <div className=" pb-6">
              <div className="mt-4 flex text-sm">
                <div className="group inline-flex items-center text-gray-500 ">
                  <SwitchVerticalIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <span className="ml-2">Daily Data</span>
                  <span className="font-bold ml-1">{dataRequired}MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-4 md:col-span-4">
              <fieldset className="grid grid-cols-4 space-y-2">
                <legend className="sr-only">Awake times</legend>

                {Object.keys(defaultValues.awake_times).map((t, i) => (
                  <div key={t} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <Field
                        id={t}
                        name={`awake_times.${t}`}
                        type="checkbox"
                        className="focus:ring-borange h-4 w-4 text-borange border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={t} className="font-medium text-gray-700">
                        {t}
                      </label>
                    </div>
                  </div>
                ))}
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
