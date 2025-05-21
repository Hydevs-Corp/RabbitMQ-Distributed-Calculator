import { runScript } from "./utils/runScript.js";

const scriptsToRun = ["producer.js", "result_client.js", "start_workers.js"];

scriptsToRun.forEach((file) => runScript(file));
