// Runs hourly, updates the data needed for the home page

import * as functions from "firebase-functions";
import { BigQuery } from "@google-cloud/bigquery";
import * as admin from "firebase-admin";

/***
 * There can be a lot of data so we use bigquery to get the data we need for the homepage every hour.
 */
export const createAggregates = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "2GB",
  })
  .region("europe-west2")
  //   Run hourly
  .pubsub.schedule("0 * * * *")
  .onRun(async (context) => {
    let [
      detectionCount30Day,
      detectionCount7Day,
      detectionCount1Day,
      recorderHealth,
    ] = await Promise.all([
      getDetectionCount(30),
      getDetectionCount(7),
      getDetectionCount(1),
      getRecorderHealthByHour7Days(),
    ]);

    for (let project of Object.keys(detectionCount30Day)) {
      let update = {
        counts: {
          "30Day": detectionCount30Day[project] || null,
          "7Day": detectionCount7Day[project] || null,
          "1Day": detectionCount1Day[project] || null,
        },
      };

      await admin.firestore().doc(`projects/${project}`).update(update);
    }

    for (let project of Object.keys(recorderHealth)) {
      for (let recorder of Object.keys(recorderHealth[project])) {
        let recorderHealthData = recorderHealth[project][recorder];

        let health = [] as (0 | 1)[];

        let now = new Date();
        // Round down to the nearest hour
        now.setMinutes(0, 0, 0);

        for (let i = 0; i < 24 * 7; i++) {
          let hour = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
          if (recorderHealthData[hour]) {
            health.push(1);
          } else {
            health.push(0);
          }
        }

        await admin
          .firestore()
          .doc(`projects/${project}/recorders/${recorder}`)
          .update({
            health,
            audioCount: recorderHealth[project][recorder],
          });
      }
    }
  });

//   Gets the total no of detections for each project and analysis over the provided time period
async function getDetectionCount(days: number) {
  const query = `
SELECT
    project,
    analysisId,
    COUNT(*) AS count
  FROM
    \`bugg-301712.bugg.detections\`
    WHERE recordedAt > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)
  GROUP BY
    project,
    analysisId`;

  // Gets the number of files we saw in the duration
  const query2 = `
      SELECT
        project,
        COUNT(*) AS count
      FROM
        \`bugg-301712.bugg.audio\`
      WHERE
        recordedAt > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)
      GROUP BY
        project`;

  // Gets the number of files we saw in the duration
  const query3 = `
      SELECT
        project,
        recorder,
        COUNT(*) AS count
      FROM
        \`bugg-301712.bugg.audio\`
      WHERE
        recordedAt > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${days} DAY)
      GROUP BY
        project,
        recorder`;

  const [rows, rows2, rows3] = await Promise.all([
    runBigQuery(query),
    runBigQuery(query2),
    runBigQuery(query3),
  ]);

  let result = {} as any;
  for (let row of rows) {
    let project = row.project;
    let analysisId = row.analysisId;
    // Remove the quotes from the analysisId
    analysisId = analysisId.replace(/^"(.*)"$/, "$1");
    console.log("analysisId", analysisId);

    let count = row.count;
    if (!result[project]) {
      result[project] = {};
    }
    result[project][analysisId] = count;
  }

  for (let row of rows2) {
    let project = row.project;
    let count = row.count;
    if (!result[project]) {
      result[project] = {};
    }
    result[project]["files"] = { _total: count };
  }

  for (let row of rows3) {
    let project = row.project;
    let recorder = row.recorder;
    let count = row.count;
    if (!result[project]) {
      result[project] = {};
    }
    if (!result[project]["files"]) {
      result[project]["files"] = {};
    }
    result[project]["files"][recorder] = count;
  }
  return result;
}

// Shows if a recorder uploaded on each hour for the last 24 hours
async function getRecorderHealthByHour7Days() {
  let query = `
SELECT
  project,
  recorder,
  TIMESTAMP_TRUNC(recordedAt, HOUR) hour,
  COUNT(*) AS count
FROM
  \`bugg-301712.bugg.audio\`
WHERE
  recordedAt > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY
  project,
  recorder,
  hour
ORDER BY
  project,
  recorder,
  hour
  `;

  let rows = await runBigQuery(query);

  let result = {} as any;
  for (let row of rows) {
    let project = row.project;
    let recorder = row.recorder;
    let hour = row.hour;
    // hour is a timestamp turn it into an ISO date
    hour = new Date(hour.value).toISOString();

    let count = row.count;
    if (!result[project]) {
      result[project] = {};
    }
    if (!result[project][recorder]) {
      result[project][recorder] = {};
    }
    result[project][recorder][hour] = count;
  }

  return result;
}

async function runBigQuery(query: string) {
  const bigquery = new BigQuery();

  // Run the query as a job
  const [job] = await bigquery.createQueryJob({
    query: query,
    location: "EU",
  });
  console.log(`Job ${job.id} started.`);

  const [rows] = await job.getQueryResults();
  console.log(`Job ${job.id} completed. ${rows.length} rows returned.`);
  return rows;
}
