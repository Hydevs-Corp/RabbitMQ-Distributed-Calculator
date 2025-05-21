import { Hono } from "hono";
import { serve } from "@hono/node-server";
import amqp from "amqplib";
import crypto from "crypto";
import logger from "./utils/logger.js";
import { readFile } from "fs/promises";
import { serveStatic } from "@hono/node-server/serve-static";

/**
 * Application web Hono
 * @type {import('hono').Hono}
 */
const app = new Hono();

/**
 * URL de connexion à RabbitMQ
 * @type {string}
 */
const AMQP_URL = process.env.AMQP_URL || "amqp://user:password@localhost:5672";

/**
 * Map pour stocker les clients SSE connectés
 * @type {Map<string, ReadableStreamDefaultController>}
 */
const sseClients = new Map();

// Middleware pour servir les fichiers statiques
app.use("/*", serveStatic({ root: "./public/" }));

/**
 * Route pour servir la page d'accueil
 */
app.get("/", async (c) => {
    const html = await readFile("./index.html", "utf-8");
    return c.html(html);
});

/**
 * Route pour établir un flux SSE avec le client
 * Permet de recevoir les résultats de calculs en temps réel
 */
app.get("/calculate/stream", async (c) => {
    const uuid = c.req.query("uuid");

    if (!uuid) return c.text("Missing uuid", 400);

    const conn = await amqp.connect(AMQP_URL);
    const ch = await conn.createChannel();
    const replyQueue = `calc_results_${uuid}`;
    await ch.assertQueue(replyQueue, { durable: true });

    const stream = new ReadableStream({
        start(controller) {
            sseClients.set(uuid, controller);

            ch.consume(
                replyQueue,
                (msg) => {
                    if (msg !== null) {
                        const res = JSON.parse(msg.content.toString());

                        controller.enqueue(
                            `data: ${JSON.stringify({
                                n1: res.n1,
                                n2: res.n2,
                                op: res.op,
                                result: res.result,
                            })}\n\n`
                        );
                        ch.ack(msg);
                    }
                },
                { noAck: false }
            );
        },
        async cancel() {
            sseClients.delete(uuid);
            await ch.close();
            await conn.close();
        },
    });

    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    return c.body(stream);
});

/**
 * Route pour soumettre une opération mathématique à calculer
 * Accepte une expression mathématique dans le corps de la requête
 */
app.post("/calculate", async (c) => {
    const body = await c.req.parseBody();

    const expr = body.screen || "";
    const match = expr.match(/(-?\d+)\s*([\+\-\*\/a])\s*(-?\d+)/);
    if (!match) {
        return c.json({ error: "Invalid format" }, 400);
    }
    const n1 = Number(match[1]);
    const opMap = { "+": "add", "-": "sub", "*": "mul", "/": "div", a: "all" };
    const op = opMap[match[2]];
    const n2 = Number(match[3]);
    if (!op) {
        return c.json({ error: "Unsupported operator" }, 400);
    }
    const uuid = body.uuid || crypto.randomUUID();
    const replyQueue = `calc_results_${uuid}`;
    const exchange = "calc_requests_direct";
    const conn = await amqp.connect(AMQP_URL);
    const ch = await conn.createChannel();
    try {
        await ch.assertExchange(exchange, "direct", { durable: true });
        await ch.assertQueue(replyQueue, { durable: true });

        if (op === "all") {
            for (const opType of ["add", "sub", "mul", "div"]) {
                const msg = JSON.stringify({
                    n1,
                    n2,
                    op: opType,
                    uuid,
                    replyTo: replyQueue,
                });
                ch.publish(exchange, opType, Buffer.from(msg), {
                    persistent: true,
                });
                const { producer } = new logger();
                producer({ message: msg, io: "outgoing" });
            }
            return c.json({ status: "pending", uuid, all: true });
        } else {
            const msg = JSON.stringify({
                n1,
                n2,
                op,
                uuid,
                replyTo: replyQueue,
            });
            ch.publish(exchange, op, Buffer.from(msg), { persistent: true });
            const { producer } = new logger();
            producer({
                message: JSON.stringify({
                    n1,
                    n2,
                    op,
                }),
                io: "outgoing",
            });
        }
    } finally {
        await ch.close();
        await conn.close();
    }

    return c.json({ status: "pending", uuid });
});

/**
 * Port d'écoute du serveur web
 * @type {number}
 */
const port = process.env.WEBSERVER_PORT || 8025;

// Démarrage du serveur
serve(
    {
        fetch: app.fetch,
        port,
    },
    (info) => {
        console.log(`Server running on http://localhost:${info.port}`);
    }
);
