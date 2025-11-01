"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const index_1 = require("./db/index");
const default_1 = __importDefault(require("./config/default"));
// Initialize database connection
(0, index_1.initDatabase)();
// Define the port
const PORT = parseInt(default_1.default.server.port) || 3000;
// Start the server
app_1.default.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
