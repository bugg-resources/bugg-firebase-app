//  Command to specify upload for just one bucket
// gsutil iam ch serviceAccount:bugg-102@bugg-301712.iam.gserviceaccount.com:objectCreator gs://bugg-audio-dropbox

// Imports the Google Cloud client library
const { Storage } = require("@google-cloud/storage");

// Creates a client from a Google service account key.
const storage = new Storage({ keyFilename: "./bugg-301712-f249f72358fa.json" });

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const bucketName = "bugg-audio-dropbox";

const filename = "File to delete, e.g. file.txt";

async function deleteFile() {
  // Deletes the file from the bucket
  await storage.bucket(bucketName).file(filename).delete();

  console.log(`gs://${bucketName}/${filename} deleted.`);
}

async function downloadFile() {
  const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: "old-growth-down.mp3",
  };

  // Downloads the file
  await storage
    .bucket(bucketName)
    .file("audio/rec_121/old-growth.mp3")
    .download(options);

  console.log(
    `gs://${bucketName}/${"audio/rec_121/old-growth.mp3"} downloaded to ${"old-growth-down.mp3"}.`
  );
}

async function listFiles() {
  // Lists files in the bucket
  const [files] = await storage.bucket(bucketName).getFiles();

  console.log("Files:");
  files.forEach((file) => {
    console.log(file.name);
  });
}

async function uploadFile() {
  // Uploads a local file to the bucket

  await storage.bucket(bucketName).upload("./old-growth.mp3", {
    // By setting the option `destination`, you can change the name of the
    destination:
      "d6aae306-fd1e-411d-9c93-cf141b06970b/00000000249ae42f/16129620954379.mp3",
    // object you are uploading to a bucket.
    metadata: {
      // Enable long-lived HTTP caching headers
      // Use only if the contents of the file will never change
      // (If the contents will change, use cacheControl: 'no-cache')
      cacheControl: "public, max-age=31536000",
    },
  });

  console.log(`${filename} uploaded to ${bucketName}.`);
}

// listFiles().catch(console.error); // pass
uploadFile().catch(console.error);
// downloadFile().catch(console.error);
// deleteFile().catch(console.error);
