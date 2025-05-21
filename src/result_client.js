import logger from "./utils/logger.js";
import { connectAndChannel } from "./utils/amqpUtils.js";

const OPS = { add: "+", sub: "-", mul: "*", div: "/" };

async function readResults() {
    const queue = "calc_results";
    const { conn, ch } = await connectAndChannel();
    await ch.assertQueue(queue, { durable: true });

    const { result_client } = new logger();

    ch.consume(
        queue,
        (msg) => {
            if (!msg) return;
            const { n1, n2, op, result } = JSON.parse(msg.content.toString());
            result_client({
                message: `${n1} ${OPS[op]} ${n2} = ${result}`,
                io: "incoming",
            });
            ch.ack(msg);
        },
        { noAck: false }
    );
}

readResults().catch((err) => {
    console.error("Erreur result client :", err);
    process.exit(1);
});
