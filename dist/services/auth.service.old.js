"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    constructor() {
        this.users = []; // This should be replaced with a database call
    }
    register(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            const newUser = { username, password: hashedPassword, role: 'user' };
            this.users.push(newUser); // This should be replaced with a database call
            return newUser;
        });
    }
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = this.users.find(u => u.username === username); // This should be replaced with a database call
            if (user && (yield bcrypt_1.default.compare(password, user.password))) {
                const token = jsonwebtoken_1.default.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
                return token;
            }
            return null;
        });
    }
    isAuthenticated(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
                return !!decoded;
            }
            catch (error) {
                return false;
            }
        });
    }
}
exports.AuthService = AuthService;
