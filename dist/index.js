"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
//-------------------------------------------------
// Dependencies
//-------------------------------------------------
const config_1 = require("./config");
const logger = __importStar(require("node-logger"));
const appName = require('../package.json').name; // Annoyingly if i use import here, the built app doesn't update.
const routes_1 = require("./routes");
//-------------------------------------------------
// Logging
//-------------------------------------------------
logger.configure(config_1.config.logger);
logger.warn(`${appName} restarted`);
//-------------------------------------------------
// Server
//-------------------------------------------------
const port = 80;
routes_1.app.listen(port, () => {
    logger.info(`Server is running on port ${80}`);
});
//# sourceMappingURL=index.js.map