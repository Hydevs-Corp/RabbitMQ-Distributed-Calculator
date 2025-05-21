import readline from "readline";
import crypto from "crypto";
import chalk from "chalk";
import cliSpinners from "cli-spinners";
import { connectAndChannel, publishMessage } from "./utils/amqpUtils.js";

/**
 * Mapping des symboles d'opération vers les noms d'opérations
 * @type {Object.<string, string>}
 */
const OPS_MAP = {
  "+": "add",
  "-": "sub",
  "*": "mul",
  "/": "div",
  a: "all",
};

/**
 * Mapping des noms d'opérations vers les symboles correspondants
 * @type {Object.<string, string>}
 */
const OPS_SYMBOL = { add: "+", sub: "-", mul: "*", div: "/" };

/**
 * Fonction principale qui initialise et gère le client interactif
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
  const exchange = "calc_requests_direct";
  const uuid = crypto.randomUUID();
  const resultQueue = `calc_results_${uuid}`;
  const { conn, ch } = await connectAndChannel();
  await ch.assertExchange(exchange, "direct", { durable: true });
  await ch.assertQueue(resultQueue, { durable: true });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.bold.cyan("➤ Enter an operation (e.g. 10 + 13): "),
  });

  let waiting = false;
  let expectedResults = 0;

  let spinnerInterval = null;
  const spinner = cliSpinners.dots;
  let spinnerIndex = 0;
  function startSpinner(message = "Waiting for result(s)...") {
    if (spinnerInterval) return;
    process.stdout.write("\n");
    spinnerIndex = 0;
    spinnerInterval = setInterval(() => {
      process.stdout.write(
        `\r${chalk.yellowBright(
          spinner.frames[spinnerIndex++ % spinner.frames.length]
        )} ${message} `
      );
    }, spinner.interval);
  }
  function stopSpinner() {
    if (spinnerInterval) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      process.stdout.write("\r\x1b[K");
    }
  }

  console.log(chalk.bgBlue.white.bold("\n  DISTRIBUTED CALCULATOR  "));
  console.log(chalk.gray(`Your session id: ${chalk.yellow(uuid)}\n`));

  ch.consume(
    resultQueue,
    (msg) => {
      if (msg !== null) {
        stopSpinner();
        const res = JSON.parse(msg.content.toString());
        const opSymbol = OPS_SYMBOL[res.op] || "?";
        console.log(
          chalk.greenBright.bold(
            `\nResult: ${chalk.yellow(res.n1)} ${chalk.magenta(
              opSymbol
            )} ${chalk.yellow(res.n2)} = ${chalk.bold.white(res.result)}`
          )
        );
        ch.ack(msg);
        expectedResults--;
        if (expectedResults === 0) {
          waiting = false;
          rl.prompt();
        }
      }
    },
    { noAck: false }
  );

  function ask() {
    if (!waiting) rl.prompt();
  }

  rl.on("line", async (line) => {
    if (waiting) return;
    const input = line.trim();
    const match = input.match(
      /^(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s*([\+\-\*\/a])\s*(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)$/i
    );
    if (!match) {
      console.log(
        chalk.bgRed.white.bold(" Invalid format. ") +
          chalk.red(" Use: number operator number (e.g. 10 + 13, 1e2 * 3)")
      );
      ask();
      return;
    }
    const n1 = parseFloat(match[1]);
    const opSymbol = match[2];
    const n2 = parseFloat(match[3]);
    const op = OPS_MAP[opSymbol];
    if (!op) {
      console.log(
        chalk.bgRed.white.bold(" Unsupported operator. ") +
          chalk.red(" Use: + - * /")
      );
      ask();
      return;
    }
    const msg = JSON.stringify({ n1, n2, op, uuid, replyTo: resultQueue });
    if (op === "all") {
      expectedResults = 4;
      for (const opType of ["add", "sub", "mul", "div"]) {
        publishMessage(ch, exchange, opType, msg);
      }
      console.log(
        chalk.blueBright(
          `Operations sent: ${chalk.yellow(n1)} ${chalk.magenta(
            "+ - * /"
          )} ${chalk.yellow(n2)}`
        )
      );
    } else {
      expectedResults = 1;
      publishMessage(ch, exchange, op, msg);
      console.log(
        chalk.blueBright(
          `Operation sent: ${chalk.yellow(n1)} ${chalk.magenta(
            opSymbol
          )} ${chalk.yellow(n2)}`
        )
      );
    }
    waiting = true;
    startSpinner();
  });

  rl.on("close", async () => {
    stopSpinner();
    console.log(chalk.gray("\nClosing session..."));
    await ch.close();
    await conn.close();
    process.exit(0);
  });

  ask();
}

/**
 * Point d'entrée du programme
 */
main().catch((err) => {
  console.error(chalk.bgRed.white("Interactive client error:"), err);
  process.exit(1);
});
