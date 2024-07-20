#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function generateEnvExample(envPath) {
    const envDir = path_1.default.dirname(envPath);
    const envFileName = ".env";
    const envExamplePath = path_1.default.join(envDir, `${envFileName}.example`);
    if (!fs_1.default.existsSync(envPath)) {
        console.error(`${envFileName} file not found`);
        process.exit(1);
    }
    const envContent = fs_1.default.readFileSync(envPath, 'utf8');
    const envExampleContent = envContent.replace(/=.*/g, '=');
    fs_1.default.writeFileSync(envExamplePath, envExampleContent);
    console.log(`${envFileName}.example file generated successfully`);
}
// Get .env file path from command-line argument
let envPath = process.argv[2];
if (!envPath) {
    console.error('Finding .env file');
    envPath = path_1.default.join(process.cwd(), '.env');
}
generateEnvExample(envPath);
