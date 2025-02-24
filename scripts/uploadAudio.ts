require("./initFirebase");
import * as admin from "firebase-admin";

let bucket = admin.storage().bucket("bugg-audio-dropbox");

let projectId = "proj_demo";
let recorderId = "bugg_RPiID-10000000abababab";
let configId = "conf_fc4fa4b";
let fileName = "2021-07-01T13_34_10.323Z.mp3";

bucket
  .upload(
    "/Users/sig/Downloads/proj_demo/bugg_RPiID-10000000ea7cb2bc/conf_3b257ec/2021-06-25T14_54_04.333Z.mp3",
    {
      destination: `${projectId}/${recorderId}/${configId}/${fileName}`,
    }
  )
  .then((res) => {
    console.log("done");
  })
  .catch((err) => {
    console.error(err);
  });
