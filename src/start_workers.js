import { runScript } from "./utils/runScript.js";

const NUM_WORKERS_PER_OP = 5;
const OPS = ["add", "sub", "mul", "div"];

// OPS x NUM_WORKERS_PER_OP
OPS.forEach((op) =>
    Array.from({ length: NUM_WORKERS_PER_OP }, (_, i) =>
        runScript("worker.js", [`${i + 1}`, op])
    )
);
