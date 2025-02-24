import { getAuth } from "firebase/auth";
import { NextPage } from "next";
import { useEffect } from "react";

const SignOut: NextPage = () => {
  useEffect(() => {
    getAuth().signOut();
  }, []);

  return null;
};

export default SignOut;
