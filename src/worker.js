import logger from "./utils/logger.js";
import { connectAndChannel } from "./utils/amqpUtils.js";

/**
 * L'identifiant unique du worker, fourni en argument ou défini par défaut à "1"
 * @type {string}
 */
const workerId = process.argv[2] || "1";

/**
 * L'opération mathématique que ce worker va traiter (add, sub, mul, div)
 * @type {string}
 */
const op = process.argv[3] || "add"; // add, sub, mul, div

/**
 * Effectue une opération mathématique entre deux nombres
 * @param {string} op - L'opération à effectuer ("add", "sub", "mul", "div")
 * @param {number} n1 - Le premier nombre
 * @param {number} n2 - Le second nombre
 * @returns {number|null} - Le résultat du calcul ou null en cas d'erreur
 */
const compute = (op, n1, n2) => {
    switch (op) {
        case "add":
            return n1 + n2;
        case "sub":
            return n1 - n2;
        case "mul":
            return n1 * n2;
        case "div":
            return n2 !== 0 ? n1 / n2 : null;
        default:
            return null;
    }
};

/**
 * Démarre le worker qui consomme des messages de la file correspondant à son opération
 * et renvoie les résultats des calculs
 * @async
 * @function startWorker
 * @returns {Promise<void>}
 */
async function startWorker() {
    const exchange = "calc_requests_direct";
    const resQueue = "calc_results";
    const { conn, ch } = await connectAndChannel();
    await ch.assertExchange(exchange, "direct", { durable: true });
    await ch.assertQueue(resQueue, { durable: true });

    const opQueue = `calc_${op}`;
    await ch.assertQueue(opQueue, { durable: true });
    await ch.bindQueue(opQueue, exchange, op);

    const { worker } = new logger();

    ch.consume(
        opQueue,
        async (msg) => {
            if (!msg) return;
            const req = JSON.parse(msg.content.toString());
            const { n1, n2, replyTo, uuid } = req;
            const result = compute(op, n1, n2);
            const wait = 5_000 + Math.floor(Math.random() * 10_000); // 5-15s
            worker({
                message: `n1=${n1}, n2=${n2}, op=${op} | Waiting ${
                    wait / 1_000
                }s`,
                io: "incoming",
                id: workerId,
                op,
            });
            await new Promise((r) => setTimeout(r, wait));
            const resMsg = JSON.stringify({ n1, n2, op, result });
            ch.sendToQueue(replyTo || resQueue, Buffer.from(resMsg), {
                persistent: true,
            });
            worker({
                message: JSON.stringify({
                    n1,
                    n2,
                    op,
                    replyTo: replyTo?.split("-")[0] + "...",
                    uuid: uuid.split("-")[0] + "...",
                }),
                io: "outgoing",
                id: workerId,
                op,
            });
            ch.ack(msg);
        },
        { noAck: false }
    );
}

/**
 * Point d'entrée du programme
 */
startWorker().catch((err) => {
    console.error("Erreur worker :", err);
    process.exit(1);
});
