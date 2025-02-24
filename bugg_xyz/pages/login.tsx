import { Dialog, Transition } from "@headlessui/react";
import { ScaleIcon, XIcon } from "@heroicons/react/outline";
import { CashIcon, ChevronRightIcon } from "@heroicons/react/solid";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Fragment, useEffect, useState } from "react";
import classNames from "../classnames";
import BuggSummaryPanel from "../components/BuggSummaryPanel";
import NavBar from "../components/NavBar";
import NavHeader from "../components/NavHeader";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getAuth } from "firebase/auth";
import { useRecoilValue } from "recoil";
import { hasFirebaseAppLoadedAtom } from "../data/initialise-firebase";
import Image from "next/image";

const uiConfig = {
  signInFlow: "popup",
  signInSuccessUrl: "/",
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
};

const imageUrls = [
  "/bugg-login-1.jpg",
  "/bugg-login-2.jpg",
  "/bugg-login-3.jpg",
  "/bugg-login-4.jpg",
];

const Login: NextPage = () => {
  let appLoaded = useRecoilValue(hasFirebaseAppLoadedAtom);

  let randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];

  return (
    <>
      <Head>
        <title>Bugg - Login</title>
        <meta name="description" content="Login to your account" />
        <link rel="icon" sizes="192x192" href="/favicon.png"></link>
      </Head>

      <div className="min-h-full flex bg-[#CBD0CA]">
        <div className="flex-1 flex flex-col justify-center items-center  py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className=" flex flex-col justify-center items-center ">
              <img className="h-20" src="/bugg-logo-vector.svg" alt="Bugg" />

              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Sign in to your account
              </h2>
            </div>

            <div className="mt-8">
              {appLoaded && (
                <StyledFirebaseAuth
                  uiConfig={uiConfig}
                  firebaseAuth={getAuth()}
                />
              )}
            </div>
          </div>
        </div>
        <div className="hidden lg:block relative w-0 flex-1 bg-slate-700">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={randomImageUrl}
            alt=""
          />
        </div>
      </div>
    </>
  );
};

export default Login;
