import amqp from "amqplib";

const AMQP_URL = process.env.AMQP_URL || "amqp://user:password@localhost:5672";

export async function connectAndChannel(url = AMQP_URL) {
    try {
        const conn = await amqp.connect(url);
        const ch = await conn.createChannel();
        return { conn, ch };
    } catch (error) {
        console.error(
            "Error connecting to RabbitMQ (" + AMQP_URL + ") :",
            error
        );
        process.exit(1);
    }
}

export function publishMessage(
    ch,
    exchange,
    routingKey,
    msg,
    persistent = true
) {
    ch.publish(exchange, routingKey, Buffer.from(msg), { persistent });
}

export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
