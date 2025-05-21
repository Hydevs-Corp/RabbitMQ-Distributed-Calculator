import chalk from "chalk";
export default class logger {
    static logTypes_font = {
        consumer: chalk.cyan,
        worker: chalk.magenta,
        result_client: chalk.green,
        producer: chalk.blue,
        info: chalk.grey,
    };
    static logType_bg = {
        incoming: chalk.bgGreenBright,
        outgoing: chalk.bgRedBright,
    };

    static timeFormater = Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        "12Hour": false,
    });

    consumer = ({ message, io, id = "" }) =>
        this.log(
            this.applyIOColor(io) +
                logger.logTypes_font.consumer(" Consumer: ") +
                message
        );

    worker = ({ message, io, id = "" }) =>
        this.log(
            this.applyIOColor(io) +
                logger.logTypes_font.worker(
                    ` Worker${id ? ` | ${id}` : ""}: `
                ) +
                message
        );

    result_client = ({ message, io, id = "" }) =>
        this.log(
            this.applyIOColor(io) +
                logger.logTypes_font.result_client(" Result Client: ") +
                message
        );

    producer = ({ message, io, id = "" }) =>
        this.log(
            this.applyIOColor(io) +
                logger.logTypes_font.producer(" Producer: ") +
                message
        );

    info = (message, id = "") =>
        this.log(
            this.applyIOColor() + logger.logTypes_font.info(" Info: ") + message
        );

    applyIOColor(io) {
        switch (io) {
            case "incoming":
                return logger.logType_bg.incoming(
                    chalk.black.bold(`<Incoming<`)
                );
            case "outgoing":
                return logger.logType_bg.outgoing(
                    chalk.black.bold(`>Outgoing>`)
                );
            default:
                return chalk.white("");
        }
    }

    log(message) {
        const time = new Date();
        console.log(logger.timeFormater.format(time) + " | " + message);
    }
}

export function displayChalkColors() {
    const colors = [
        "black",
        "red",
        "green",
        "yellow",
        "blue",
        "magenta",
        "cyan",
        "white",
        "gray",
        "blackBright",
        "redBright",
        "greenBright",
        "yellowBright",
        "blueBright",
        "magentaBright",
        "cyanBright",
        "whiteBright",
    ];

    const bgColors = [
        "bgBlack",
        "bgRed",
        "bgGreen",
        "bgYellow",
        "bgBlue",
        "bgMagenta",
        "bgCyan",
        "bgWhite",
        "bgGray",
        "bgBlackBright",
        "bgRedBright",
        "bgGreenBright",
        "bgYellowBright",
        "bgBlueBright",
        "bgMagentaBright",
        "bgCyanBright",
        "bgWhiteBright",
    ];

    console.log("=== Foreground Colors ===");
    colors.forEach((color) => {
        if (chalk[color]) {
            console.log(chalk[color](`This text is in ${color}`));
        }
    });

    console.log("\n=== Background Colors ===");
    bgColors.forEach((bgColor) => {
        if (chalk[bgColor]) {
            console.log(chalk[bgColor](`This background is in ${bgColor}`));
        }
    });

    console.log("\n=== Combinations ===");
    colors.slice(0, 5).forEach((color) => {
        bgColors.slice(0, 5).forEach((bgColor) => {
            if (chalk[color] && chalk[bgColor]) {
                console.log(
                    chalk[color][bgColor](`${color} text on ${bgColor}`)
                );
            }
        });
    });
}
