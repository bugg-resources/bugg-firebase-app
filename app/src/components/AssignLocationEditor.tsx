import { Link, useLinkTo, useRoute } from "@react-navigation/native";
import firebase from "firebase/app";
import { Formik, useField } from "formik";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";
import { Recorder } from "../../types";

interface AssignLocationEditorProps {
  device?: Recorder;
}

const defaultCursor = { cursor: "auto" } as any;

const defaultValues = {
  label: "",
  latitude: 0,
  longitude: 0,
};

const FormSchema = Yup.object().shape({
  label: Yup.string().required("Required").typeError("Required"),
  latitude: Yup.number().required("Required").typeError("Required"),
  longitude: Yup.number().required("Required").typeError("Required"),
});

function AssignLocationEditor(props: AssignLocationEditorProps) {
  let route = useRoute();
  let { projectId, deviceId, assign } = route.params as any;
  let device = props.device;

  const slideAnim = useRef(new Animated.Value(-400)).current;
  useEffect(() => {
    Animated.timing(slideAnim, {
      useNativeDriver: false,
      toValue: !assign ? -400 : 0,
      duration: 300,
    }).start();
  }, [assign]);

  let swallow = useCallback((e: GestureResponderEvent) => {
    e.preventDefault();
  }, []);

  let initialValues = useMemo(() => {
    if (device?.site && device.location) {
      return {
        label: device.site,
        latitude: device.location.latitude,
        longitude: device.location.longitude,
      };
    }

    return defaultValues;
  }, [device]);

  let linkTo = useLinkTo();

  return (
    <View
      pointerEvents={assign ? "auto" : "none"}
      style={styles.AssignLocationEditor}
    >
      <Link
        to={`/${projectId}/settings/${deviceId}`}
        style={[
          styles.AssignLocationEditor,
          { backgroundColor: assign ? "rgba(0,0,0,0.3)" : "transparent" },
        ]}
      >
        <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sidebar, defaultCursor]}
            onPress={swallow}
          >
            <ScrollView
              key={`${assign}`}
              style={{ flex: 1 }}
              contentContainerStyle={styles.content}
            >
              {initialValues && (
                <Formik
                  initialValues={initialValues}
                  validationSchema={FormSchema}
                  onSubmit={async (values, context) => {
                    let update: Partial<Recorder> = {
                      site: values.label,
                      name: values.label,
                      location: new firebase.firestore.GeoPoint(
                        // if a space is added this values are strings
                        parseFloat(values.latitude as any),
                        parseFloat(values.longitude as any)
                      ),
                    };
                    await firebase
                      .firestore()
                      .doc(`projects/${projectId}/recorders/${deviceId}`)
                      .update(update);
                    context.setSubmitting(false);

                    linkTo(`/${projectId}/settings/${deviceId}`);
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
                    return (
                      <>
                        <View style={styles.section}>
                          <SettingText
                            label={"Site Label"}
                            name={"label"}
                          ></SettingText>
                          <SettingText
                            label={"Latitude"}
                            name={"latitude"}
                          ></SettingText>
                          <SettingText
                            label={"Longitude"}
                            name={"longitude"}
                          ></SettingText>
                        </View>

                        <View style={styles.actions}>
                          <TouchableOpacity
                            style={[
                              styles.button,
                              (!dirty || !isValid) && styles.buttonDisabled,
                              isSubmitting && styles.buttonDisabled,
                            ]}
                            disabled={!dirty || !isValid}
                            onPress={(e) => {
                              e.preventDefault();
                              submitForm();
                            }}
                          >
                            <Text style={styles.buttonLabel}>Update</Text>
                          </TouchableOpacity>
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

const styles = StyleSheet.create({
  AssignLocationEditor: {
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
});

export default memo(AssignLocationEditor);
