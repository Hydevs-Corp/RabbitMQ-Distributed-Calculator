import { spawn } from "child_process";
import path from "path";
import { __dirname } from "../__dirname.js";

/**
 * Liste des processus enfants lancés par cette application
 * @type {import('child_process').ChildProcess[]}
 */
const children = [];

/**
 * Nettoie et termine tous les processus enfants
 * @function cleanup
 * @returns {void}
 */
const cleanup = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};
let cleanupRegistered = false;

/**
 * Exécute un script Node.js en tant que processus enfant
 * @function runScript
 * @param {string} script - Chemin du script à exécuter (relatif au dossier src)
 * @param {string[]} args - Arguments à passer au script
 * @returns {import('child_process').ChildProcess} - Le processus enfant créé
 */
export function runScript(script, args = []) {
  const child = spawn("node", [path.join(__dirname, script), ...args], {
    stdio: "inherit",
  });
  children.push(child);

  if (!cleanupRegistered) {
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
      cleanup();
      process.exit();
    });
    process.on("SIGTERM", () => {
      cleanup();
      process.exit();
    });
    cleanupRegistered = true;
  }
}
