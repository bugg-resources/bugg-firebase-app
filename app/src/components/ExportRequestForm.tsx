import { Link, useLinkTo, useRoute } from "@react-navigation/native";
import firebase from "firebase/app";
import { Field, Formik, useField } from "formik";
import React, { memo, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";
import { ExportJob } from "../../types";

interface ExportRequestFormProps {}

const defaultCursor = { cursor: "auto" } as any;

const defaultValues = {
  type: "detections",
  from: "",
  to: "",
};

const FormSchema = Yup.object().shape({
  type: Yup.string().required().oneOf(["audio", "detections"]),
  from: Yup.date().optional(),
  to: Yup.date()
    .optional()
    .min(Yup.ref("from"), "To date can't be before From date"),
});

function ExportRequestForm(props: ExportRequestFormProps) {
  let route = useRoute();
  let { exportId, projectId } = route.params as any;

  const slideAnim = useRef(new Animated.Value(-400)).current;
  useEffect(() => {
    Animated.timing(slideAnim, {
      useNativeDriver: false,
      toValue: !exportId ? -400 : 0,
      duration: 300,
    }).start();
  }, [exportId]);

  let linkTo = useLinkTo();

  return (
    <View
      pointerEvents={exportId ? "auto" : "none"}
      style={[
        styles.ConfigEditor,
        { backgroundColor: exportId ? "rgba(0,0,0,0.3)" : "transparent" },
      ]}
    >
      <Link to={`/${projectId}/exports`} style={[styles.overlay]}>
        <View style={styles.overlay}></View>
      </Link>

      <Animated.View
        style={[styles.sidebar, { right: slideAnim }]}
        pointerEvents={"box-none"}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sidebar, defaultCursor]}
        >
          <ScrollView
            key={`${exportId}`}
            style={{ flex: 1 }}
            contentContainerStyle={styles.content}
          >
            <Formik
              initialValues={defaultValues}
              validationSchema={FormSchema}
              onSubmit={async (values, context) => {
                let ref = firebase.firestore().collection("exports").doc();

                let job: ExportJob = {
                  id: ref.id,
                  createdAt: firebase.firestore.Timestamp.now(),
                  projectId: projectId,
                  status: "CREATED",
                  type: values.type as any,
                };

                if (values.from) {
                  job.from = firebase.firestore.Timestamp.fromDate(
                    new Date(values.from)
                  );
                }

                if (values.to) {
                  job.to = firebase.firestore.Timestamp.fromDate(
                    new Date(values.to)
                  );
                }

                console.log(job);
                await ref.set(job);

                context.setSubmitting(false);

                linkTo(`/${projectId}/exports`);
              }}
            >
              {({ isValid, submitForm, isSubmitting }) => {
                return (
                  <>
                    <View style={styles.section}>
                      <SettingSelect
                        label={"Type"}
                        name="type"
                        helpText={
                          "Choose to export only the audio records that contain detections or export all audio records."
                        }
                        options={["detections", "audio"]}
                      ></SettingSelect>

                      <SettingDate
                        label={"From"}
                        name={"from"}
                        helpText={"Optional. The date to start the export from"}
                      ></SettingDate>
                      <SettingDate
                        label={"To"}
                        name={"to"}
                        helpText={"Optional. The date to end the export"}
                      ></SettingDate>
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.buttonGreen,
                          !isValid && { opacity: 0.3 },
                          isSubmitting && { opacity: 0.3 },
                        ]}
                        disabled={!isValid || isSubmitting}
                        onPress={(e) => {
                          e.preventDefault();
                          submitForm();
                        }}
                      >
                        {isSubmitting && (
                          <ActivityIndicator></ActivityIndicator>
                        )}
                        <Text style={styles.buttonLabel}>Export</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              }}
            </Formik>
          </ScrollView>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

interface SettingDateProps {
  label: string;
  helpText?: string;
  name: string;
  placeholder?: string;
}

function SettingDate(props: SettingDateProps) {
  const [field, meta, helpers] = useField(props.name);

  let { label, name, helpText, ...other } = props;

  if (!name) {
    return null;
  }

  return (
    <View style={styles.fieldset}>
      <Text style={styles.label}>{label}</Text>
      {helpText && <Text style={styles.labelHelp}>{props.helpText}</Text>}

      <Field
        onClick={(e: any) => {
          e.stopPropagation();
          // e.preventDefault();
        }}
        type="date"
        name={props.name}
        placeholder={props.placeholder}
        style={inputCss}
      />

      {meta.error && meta.touched && (
        <Text style={styles.error}>{meta.error}</Text>
      )}
    </View>
  );
}

interface SettingSelectProps {
  label: string;
  helpText?: string;
  name: string;
  options: string[];
}

function SettingSelect(props: SettingSelectProps) {
  const [, meta] = useField(props.name);

  let { label, name, helpText, options } = props;

  if (!name) {
    return null;
  }

  return (
    <View style={styles.fieldset}>
      <Text style={styles.label}>{label}</Text>
      {helpText && <Text style={styles.labelHelp}>{props.helpText}</Text>}

      <Field as="select" name="type" style={inputCss}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Field>

      {meta.error && meta.touched && (
        <Text style={styles.error}>{meta.error}</Text>
      )}
    </View>
  );
}
let inputCss = {
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
};

const styles = StyleSheet.create({
  ConfigEditor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 320,
    zIndex: 100,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 320,
    backgroundColor: "#F6F6F9",
    zIndex: 200,
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

export default memo(ExportRequestForm);
