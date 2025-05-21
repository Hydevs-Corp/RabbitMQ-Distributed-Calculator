import "dotenv/config";
import amqp from "amqplib";

const ENVIRONMENT = process.env.NODE_ENV || "local";
let AMQP_URL =
    ENVIRONMENT === "prod" ? process.env.AMQP_URL : process.env.AMQP_URL_LOCAL;

if (!AMQP_URL) {
    console.error(
        "AMQP_URL is not set in the environment variables. Please set it."
    );
}

export async function connectAndChannel(url = AMQP_URL) {
    try {
        const conn = await amqp.connect(url);
        const ch = await conn.createChannel();
        return { conn, ch };
    } catch (error) {
        console.error("Error connecting to RabbitMQ (" + url + ") :", error);
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
