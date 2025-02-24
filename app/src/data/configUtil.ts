import { Platform } from "react-native";
import { RecorderConfig } from "../../types";

/***
 * The defaults. Contains a key to upload to the dropbox
 */
const baseConfig = {
  type: "service_account",
  project_id: "bugg-301712",
  private_key_id: "322554819086a62094258112b81c75d4e655011b",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCngR924m/2Uyhb\nBIpVihICcAvVasAtb1o+sCjzzSnnLKuXYGWsieobgRzNCI3rUvdLvG9eIMQcpd20\nlSxp2hKiRtoDQC25AcI90WinXI3URfimHThmp697ljbc3untHXGMP8NkAlDG9vka\nlpUP/4/P3bKmYQqKEpfRwvXgHwLngxssxqTeQ833bZxHMJ9c47OwVpAw5yeKZhzD\n9VgMgv6biPZod6KS2ctIRFzD8EJdL0ioAdLn0+K98tLxe7wsGo40ToKOY4o3rsGa\n4kc6GJIMHK+QK7PCr+ylW92bjhbzZrRaMu7NhTHDWev+HE4gmmc5rd8H1Lg2oBf0\nUFakDezvAgMBAAECggEABS2etWQmpezIMJghVqegCuc/1mcobb8lgQ6dFXxgMT9W\nRqW6Pu08iYEiTMxY5s93yaWXo8dLiL8v7Wc3KkaNkOqzzqnrP+7n/FU+8P2RfOB0\n4V3B4pqIeD+ajpVtkeD5I6bM+YiAysXTyZiiHw59eaWW4kHZu477loZ6Z2VOB64f\nCR4UC5I4L+mCi+Nr1RetI57SIvp6AGViX0xcu97iiiSYjGMZeFxC7VBYWTfytZTw\n03jM072e0P7u3Yv3nb8604y903T25cMHZ5i4TpfyJVq0PWuA2yZwlHHnJJEIR7/R\ncViEA7sru16fmNlYQacrPMmKv+TogeQpy24u3dR+oQKBgQDksp51M7xmt0Jgshf5\ny2KOz2NxUjt9OumJqvRMs/N9fMqjjTK/lTRvDwjDhCiwhibEeVfseIfn6ohsvXTN\nauPHT8mC2r33gGq5+C1swxQgujZ7n2z1R0swYPn1/YdKRXwLjeEkH3F1Z48pgW+5\nASC3MCmdOsejUN+ZqvETW/YdhwKBgQC7gFWHJlNf58HK8prUgiaklqgYUxg1ci+m\n+dPN6CaTcDoRBsfPmZrWFfHZPbhqedNlC9YWYdir5qdSLZqfsO7u+c1ap2qlUzM0\nCMmWkkdRkPhzGnm31C9yXNWzPvvTZ2WUr8Sa4r6jhjQFBIQCK2zwfCaO80EXEiUd\nCvRTtNdPWQKBgC1fKoTCENyn+ulIK+2I5jLC/k2bLOY5a9++JN2azfHVcjZkau8L\nYO2vo+N2MsRiuQo9sK3fc8cVBp/cLnIahLokICxvzURvG71teUWcpj+f8fMwu+Ml\nk8szUiP1eoPHqUZ5jXMnMdFDDGoFne6sRJtTWM4yvSyvfMz11wIqOne9AoGBAJef\nG4qCj4FKZAe9Tz7xUFZgDeY9q6HsiGQ6OfCT/j3TzuDd3s4dpHvimwPVST+w7CUW\nATVwQkof5sYpYpQn+8776feY0kCGmy1Evd8owstOs9pAWpUw3H1aXOTp1bIKNraZ\nvB6TpR2O9JnqIOWwQBPoETYft070uVZW+WSHJGVhAoGBAJ2922zRQoT9OzPMKwsh\nTbPkizk8+DiS4xon12EhZeHCPPfzRpn/N6aC87HtynusFRrjeNJDy1aVV0jr1eiu\nb6LXARTICM8MuHiqLhIENIhR5SJvOe6kQbyUN+zuFeHMUIe7oOKjc797DddJas41\nJ2dP6hwLo8Tklm3igp9VtdCY\n-----END PRIVATE KEY-----\n",
  client_email: "bugg-102@bugg-301712.iam.gserviceaccount.com",
  client_id: "105702542097850865691",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/bugg-102%40bugg-301712.iam.gserviceaccount.com",
};

export async function generateConfigId(
  projectId: string,
  config: RecorderConfig
) {
  let items = [
    projectId,
    config.mobile_network.hostname,
    config.mobile_network.username,
    config.mobile_network.password,

    config.sensor.awake_times.sort().join(","),
    config.sensor.capture_delay,
    config.sensor.compress_data,
    config.sensor.record_freq,
    config.sensor.record_length,
    config.sensor.sensor_type,
  ].join("");

  let hash = await digestMessage(items);
  return `conf_${hash.substr(0, 7)}`;
}

export function downloadConfig(projectId: string, config: RecorderConfig) {
  if (Platform.OS !== "web") {
    throw new Error("Unsupported");
  }

  let mergedConfig = {
    ...baseConfig,
    sensor: config.sensor,
    mobile_network: config.mobile_network,
    device: {
      gcs_bucket_name: "bugg-audio-dropbox",
      project_id: projectId.replace("proj_", ""),
      config_id: config.configId.replace("conf_", ""),
    },
  };

  // let filename = `bugg-config-${config.configId}.json`;
  let filename = `config.json`;
  let text = JSON.stringify(mergedConfig, null, 3);

  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
