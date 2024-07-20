#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function generateEnvExample(envPath: string) {
    const envDir = path.dirname(envPath);
    const envFileName = ".env";
    const envExamplePath = path.join(envDir, `${envFileName}.example`);

    if (!fs.existsSync(envPath)) {
        console.error(`${envFileName} file not found`);
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envExampleContent = envContent.replace(/=.*/g, '=');

    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log(`${envFileName}.example file generated successfully`);
}

// Get .env file path from command-line argument
let envPath = process.argv[2];

if (!envPath) {
    console.error('Finding .env file');
    envPath = path.join(process.cwd(), '.env');
}

generateEnvExample(envPath);