import firebase from "firebase/app";
import React, { memo } from "react";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import { StyleSheet, View } from "react-native";
import { BuggLogo } from "../components/Icons";

interface LoginProps {}

// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: "popup",
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: "/",
  // We will display Google and Facebook as auth providers.
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
};

function Login(props: LoginProps) {
  return (
    <View style={styles.Login}>
      <View style={styles.loginPanel}>
        <View style={styles.logo}>
          <BuggLogo width={200}></BuggLogo>
        </View>
        <StyledFirebaseAuth
          uiConfig={uiConfig}
          firebaseAuth={firebase.auth()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  Login: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  loginPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",

    borderColor: "#E8ECEE",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 15,
    padding: 24,
  },
  logo: {
    height: 90,
    overflow: "hidden",
    marginBottom: 24,
  },
});

export default memo(Login);
