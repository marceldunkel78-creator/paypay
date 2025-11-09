"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCompleteMigration = void 0;
const index_1 = require("./index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function runCompleteMigration() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting complete database migration...');
            const connection = yield (0, index_1.connectToDatabase)();
            // Lade die konsolidierte SQL-Datei
            const sqlPath = path.join(__dirname, '../../migrations/complete-database-setup.sql');
            const migrationSQL = fs.readFileSync(sqlPath, 'utf8');
            // Teile die SQL-Befehle auf (getrennt durch Semikolon)
            const statements = migrationSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            console.log(`Executing ${statements.length} SQL statements...`);
            // Führe jeden SQL-Befehl einzeln aus
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                // Überspringe Kommentare und leere Zeilen
                if (statement.startsWith('--') || statement.length < 5) {
                    continue;
                }
                try {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    yield connection.execute(statement);
                }
                catch (error) {
                    // Ignoriere "Already exists" Fehler, aber logge andere
                    if (error instanceof Error && !error.message.includes('already exists')) {
                        console.warn(`Warning in statement ${i + 1}:`, error.message);
                    }
                }
            }
            console.log('Complete database migration completed successfully!');
        }
        catch (error) {
            console.error('Error in complete migration:', error);
            throw error;
        }
    });
}
exports.runCompleteMigration = runCompleteMigration;
