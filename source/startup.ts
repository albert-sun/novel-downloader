import log from "loglevel";
import { settings } from "./settings.js";
import { module } from "./downloader/modules/boxnovel-com.js";

// Main function, called asynchronously
async function main() {
    // Miscellaneous startup tasks
    console.clear();

    // Setup verbose logging for given level
    log.setLevel(settings.LOG_LEVEL);
    const originalFactory = log.methodFactory;
    log.methodFactory = function(methodName: string, level: log.LogLevelNumbers, loggerName: string | symbol): log.LoggingMethod {
        const rawMethod = originalFactory(methodName, level, loggerName);
        return function(message: string, trace: string[]) {
            // Logging formatted with timestamp, trace, and message
            const timestamp = (new Date().toTimeString().substring(0, 8));
            rawMethod(`[${timestamp}]\t${methodName.padEnd(5)}\t${trace.join("/").padEnd(20)} ${message}`);
        }
    }

    // Setup downloader and exporter instances
    const novelMeta = await module.getNovelMeta("https://boxnovel.com/novel/the-legendary-mechanic-boxnovel/");
    console.log(novelMeta);
}

await main();