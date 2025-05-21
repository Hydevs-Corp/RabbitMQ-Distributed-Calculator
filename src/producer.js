import logger from "./utils/logger.js";
import crypto from "crypto";
import {
  connectAndChannel,
  publishMessage,
  getRandomInt,
} from "./utils/amqpUtils.js";

/**
 * Liste des opérations disponibles
 * @type {string[]}
 */
const OPS = ["add", "sub", "mul", "div", "all"];

/**
 * Fonction qui envoie périodiquement des opérations mathématiques aléatoires
 * @async
 * @function send
 * @returns {Promise<void>}
 */
async function send() {
  const exchange = "calc_requests_direct";
  const { conn, ch } = await connectAndChannel();
  await ch.assertExchange(exchange, "direct", { durable: true });

  const { producer } = new logger();

  setInterval(() => {
    const n1 = getRandomInt(100);
    const n2 = getRandomInt(100);
    const op = OPS[getRandomInt(OPS.length)];
    const uuid = crypto.randomUUID();
    const msg = JSON.stringify({ n1, n2, op, uuid });

    const publishMsg = (opType) => {
      publishMessage(ch, exchange, opType, msg);
      producer({ message: msg, io: "outgoing" });
    };

    if (op === "all") {
      ["add", "sub", "mul", "div"].forEach(publishMsg);
    } else {
      publishMsg(op);
    }
  }, 1_000);
}

/**
 * Point d'entrée du programme
 */
send().catch((err) => {
  console.error("Erreur lors de l'envoi :", err);
  process.exit(1);
});
