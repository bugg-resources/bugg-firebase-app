import { Link, useLinkTo, useRoute } from "@react-navigation/native";
import firebase from "firebase/app";
import { Formik, useField } from "formik";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";
import { RecorderConfig } from "../../types";
import { downloadConfig, generateConfigId } from "../data/configUtil";

interface ConfigEditorProps {
  allConfigs: RecorderConfig[];
}

const defaultCursor = { cursor: "auto" } as any;

const times = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

const defaultValues = {
  configId: "_new",
  awake_times: times,
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

function ConfigEditor(props: ConfigEditorProps) {
  let route = useRoute();
  let { projectId, configId } = route.params as any;

  let isCreatingNew = configId === "_new";

  let existingConfig = useMemo(() => {
    if (isCreatingNew) {
      return null;
    }
    return props.allConfigs.find((c) => c.configId === configId);
  }, [configId, isCreatingNew, props.allConfigs]);

  const slideAnim = useRef(new Animated.Value(-400)).current;
  useEffect(() => {
    Animated.timing(slideAnim, {
      useNativeDriver: false,
      toValue: !configId ? -400 : 0,
      duration: 300,
    }).start();
  }, [configId]);

  let swallow = useCallback((e: GestureResponderEvent) => {
    e.preventDefault();
  }, []);

  let initialValues = useMemo(() => {
    if (existingConfig) {
      return {
        configId: existingConfig.configId,
        awake_times: existingConfig.sensor.awake_times,
        capture_delay: existingConfig.sensor.capture_delay,
        sensor_type: existingConfig.sensor.sensor_type,
        record_length: existingConfig.sensor.record_length,
        compress_data: existingConfig.sensor.compress_data,
        record_freq: existingConfig.sensor.record_freq,
        hostname: existingConfig.mobile_network.hostname,
        username: existingConfig.mobile_network.username,
        password: existingConfig.mobile_network.password,
      };
    }

    return defaultValues;
  }, [existingConfig]);

  let allConfigIds = useMemo(() => {
    return new Set(props.allConfigs.map((c) => c.configId));
  }, [props.allConfigs]);

  let linkTo = useLinkTo();

  return (
    <View
      pointerEvents={configId ? "auto" : "none"}
      style={styles.ConfigEditor}
    >
      <Link
        to={`/${projectId}/config`}
        style={[
          styles.ConfigEditor,
          { backgroundColor: configId ? "rgba(0,0,0,0.3)" : "transparent" },
        ]}
      >
        <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sidebar, defaultCursor]}
            onPress={swallow}
          >
            <ScrollView
              key={`${configId}`}
              style={{ flex: 1 }}
              contentContainerStyle={styles.content}
            >
              {initialValues && (
                <Formik
                  initialValues={initialValues}
                  validationSchema={FormSchema}
                  onSubmit={async (values, context) => {
                    let config = toConfig(projectId, values);

                    await firebase
                      .firestore()
                      .doc(`config/${config.configId}`)
                      .set(config);
                    context.setSubmitting(false);

                    downloadConfig(projectId, config);

                    linkTo(`/${projectId}/config`);
                  }}
                >
                  {({
                    values,
                    dirty,
                    isValid,
                    setFieldValue,
                    submitForm,
                    isSubmitting,
                  }) => {
                    let hoursAwake = values.awake_times.length;
                    let recordingTime = `${hoursAwake}`;
                    let recordingSeconds = hoursAwake * 60 * 60;

                    if (
                      !isNaN(values.record_length) &&
                      !isNaN(values.capture_delay)
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
                    let dataRequired = Math.round(
                      (recordingSeconds * bitrate) / 8 / 1024
                    );

                    let canSubmit = isValid && dirty;
                    let canDownload =
                      allConfigIds.has(values.configId) && !dirty;

                    useEffect(() => {
                      let config = toConfig(projectId, values);
                      generateConfigId(projectId, config).then((id) => {
                        setFieldValue("configId", id);
                      });
                    }, [values, setFieldValue, projectId]);

                    return (
                      <>
                        <View style={styles.section}>
                          <SettingText
                            label={"Mobile APN Hostname"}
                            name={"hostname"}
                          ></SettingText>
                          <SettingText
                            label={"Username"}
                            name={"username"}
                          ></SettingText>
                          <SettingText
                            label={"Password"}
                            name={"password"}
                          ></SettingText>
                        </View>
                        <View style={styles.section}>
                          <SettingCheckbox
                            label="Compress Audio"
                            name={"compress_data"}
                          ></SettingCheckbox>
                          <SettingText
                            label={"Sample Frequency (Hz)"}
                            name={"record_freq"}
                          ></SettingText>
                          <SettingText
                            label={"Recording Length (Seconds)"}
                            name={"record_length"}
                            helpText={
                              "The duration of each recording. Max 1 hour."
                            }
                          ></SettingText>
                          <SettingText
                            label={"Recording Interval (Seconds)"}
                            name={"capture_delay"}
                            helpText="The time to wait between recording."
                          ></SettingText>

                          <View style={styles.fieldset}>
                            <Text style={styles.label}>Awake Times</Text>
                            <Text style={styles.labelHelp}>
                              Select the times the device is to remain
                              powered-on
                            </Text>

                            <Multiselect
                              options={times}
                              selected={values.awake_times}
                              onChange={(selected) =>
                                setFieldValue("awake_times", selected, true)
                              }
                            ></Multiselect>
                          </View>
                          <View style={styles.callouts}>
                            <View style={styles.calloutBlock}>
                              <Text style={styles.calloutBlockTitle}>
                                Awake for
                              </Text>
                              <Text style={styles.calloutBlockValue}>
                                {hoursAwake}hrs
                              </Text>
                            </View>

                            <View style={styles.calloutBlock}>
                              <Text style={styles.calloutBlockTitle}>
                                Recording
                              </Text>
                              <Text style={styles.calloutBlockValue}>
                                {recordingTime}
                                hrs
                              </Text>
                            </View>

                            <View
                              style={[styles.calloutBlock, { marginRight: 0 }]}
                            >
                              <Text style={styles.calloutBlockTitle}>
                                Daily Data
                              </Text>
                              <Text style={styles.calloutBlockValue}>
                                {dataRequired}MB
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.actions}>
                          {!canDownload && (
                            <TouchableOpacity
                              style={[
                                styles.button,
                                !canSubmit && styles.buttonDisabled,
                                isSubmitting && styles.buttonDisabled,
                              ]}
                              disabled={!canSubmit}
                              onPress={(e) => {
                                e.preventDefault();
                                submitForm();
                              }}
                            >
                              <Text style={styles.buttonLabel}>
                                {isCreatingNew
                                  ? "Save & Download"
                                  : "Save New Config & Download"}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {canDownload && (
                            <TouchableOpacity
                              style={[styles.button, styles.buttonGreen]}
                              onPress={(e) => {
                                e.preventDefault();
                                downloadConfig(
                                  projectId,
                                  toConfig(projectId, values)
                                );
                              }}
                            >
                              <Text style={styles.buttonLabel}>Download</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={styles.configIdContainer}>
                          <Text style={styles.configId}>{values.configId}</Text>
                        </View>
                      </>
                    );
                  }}
                </Formik>
              )}
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </Link>
    </View>
  );
}

function toConfig(
  projectId: string,
  values: {
    configId: string;
    awake_times: string[];
    capture_delay: number;
    sensor_type: string;
    record_length: number;
    compress_data: boolean;
    record_freq: number;
    hostname: string;
    username: string;
    password: string;
  }
): RecorderConfig {
  return {
    createdAt: firebase.firestore.Timestamp.now(),
    configId: values.configId,
    projectId: projectId,
    sensor: {
      capture_delay: values.capture_delay,
      sensor_type: values.sensor_type,
      record_length: values.record_length,
      compress_data: values.compress_data,
      record_freq: values.record_freq,
      awake_times: values.awake_times,
    },
    mobile_network: {
      hostname: values.hostname,
      username: values.username,
      password: values.password,
    },
  };
}

interface SettingTextProps extends TextInputProps {
  label: string;
  helpText?: string;
  name: string;
}

function SettingText(props: SettingTextProps) {
  const [field, meta, helpers] = useField(props.name);

  let { label, name, helpText, ...other } = props;

  if (!name) {
    return null;
  }

  return (
    <View style={styles.fieldset}>
      <Text style={styles.label}>{label}</Text>
      {helpText && <Text style={styles.labelHelp}>{props.helpText}</Text>}
      <TextInput
        style={styles.input}
        onChangeText={helpers.setValue}
        onBlur={() => helpers.setTouched(true)}
        value={field.value}
        {...other}
      ></TextInput>
      {meta.error && meta.touched && (
        <Text style={styles.error}>{meta.error}</Text>
      )}
    </View>
  );
}

interface SettingCheckboxProps {
  label: string;
  helpText?: string;
  name: string;
}

function SettingCheckbox(props: SettingCheckboxProps) {
  const [field, meta, helpers] = useField(props.name);

  let { label, name, helpText, ...other } = props;

  if (!name) {
    return null;
  }

  return (
    <View style={styles.fieldset}>
      <Text style={styles.label}>{label}</Text>
      {helpText && <Text style={styles.labelHelp}>{props.helpText}</Text>}
      <Switch
        onValueChange={(value) => helpers.setValue(value)}
        value={field.value}
        style={styles.switch}
      ></Switch>
      {meta.error && meta.touched && <Text>{meta.error}</Text>}
    </View>
  );
}

interface MultiselectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function Multiselect(props: MultiselectProps) {
  let onPress = useCallback(
    (option: string) => {
      if (props.selected.includes(option)) {
        // remove it
        props.onChange(props.selected.filter((o) => o !== option));
      } else {
        let newSelected = [...props.selected];
        newSelected.push(option);
        props.onChange(newSelected);
      }
    },
    [props.onChange, props.selected]
  );

  return (
    <View style={styles.multiselect}>
      {props.options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[
            styles.multiselectOption,
            props.selected.includes(o) && styles.multiselectOptionSelected,
          ]}
          onPress={(e) => {
            e.preventDefault();
            onPress(o);
          }}
        >
          <Text
            style={[
              styles.multiselectOptionText,

              props.selected.includes(o) &&
                styles.multiselectOptionTextSelected,
            ]}
          >
            {o}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ConfigEditor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 320,
    backgroundColor: "#F6F6F9",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    flexBasis: 1,
    flexGrow: 1,
    flexShrink: 1,

    padding: 16,
  },
  section: {
    flexShrink: 0,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginVertical: 8,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },

  fieldset: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    marginVertical: 8,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#92929D",
    paddingLeft: 4,
  },
  labelHelp: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#92929D",
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  error: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#ED6237",
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#50505B",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#CDCDD8",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 4,
  },
  switch: {
    marginTop: 8,
  },

  multiselect: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    flexWrap: "wrap",
    backgroundColor: "rgba(236, 236, 242,1)",
    borderRadius: 6,
  },
  multiselectOption: {
    margin: 8,
    paddingVertical: 4,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  multiselectOptionSelected: {
    // backgroundColor: "Green",
  },
  multiselectOptionText: {
    color: "rgba(0,0,0,0.2)",
    fontFamily: "Inter_600SemiBold",
  },
  multiselectOptionTextSelected: {
    // color: "rgba(100, 196, 184,1)",
    color: "#92929D",
    fontFamily: "Inter_700Bold",
  },
  callouts: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  calloutBlock: {
    backgroundColor: "#ECECF2",
    padding: 12,
    borderRadius: 8,
    marginRight: 4,
  },
  calloutBlockTitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#92929D",
  },
  calloutBlockValue: {
    fontFamily: "Inter_700Bold",
    color: "#92929D",
    fontSize: 17,
    letterSpacing: -1,
  },

  actions: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingBottom: 20,
  },
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: "#ED6237",
    flexGrow: 1,
    borderRadius: 8,
  },
  buttonGreen: {
    backgroundColor: "#64C4B8",
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#FFF",
  },
  configIdContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  configId: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#92929D",
    opacity: 0.6,
  },
});

export default memo(ConfigEditor);
