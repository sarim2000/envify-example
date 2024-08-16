#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import { generateEnvExample, handleConsulConfig, uploadToConsul, convertEnvToJson, downloadFromConsul } from './utils.js';

const program = new Command();

program
  .name('env-tool')
  .description('CLI to convert .env files and optionally upload to Consul')
  .version('1.0.0');

program.command('convert')
  .description('Convert .env file to .env.example or .env.json')
  .option('-p, --path <path>', 'Path to the .env file', path.join(process.cwd(), '.env'))
  .option('-t, --type <type>', 'Output type: "example" or "json"', 'example')
  .action((options) => {
    const envPath = options.path;
    const envType = options.type as 'example' | 'json';
    generateEnvExample(envPath, envType);
  });

program.command('configure-consul')
  .description('Configure Consul settings')
  .option('-c, --configure', 'Configure Consul settings')
  .option('-s, --save-config', 'Save Consul configuration for future use')
  .action(async (options) => {
    await handleConsulConfig(options.configure, options.saveConfig);
  });

program.command('download')
  .description('Download .env.json file from Consul')
  .option('-p, --path <path>', 'Path to the .env.json file', path.join(process.cwd(), '.env.json'))
  .action(async (options) => {
    const envPath = options.path;
    const envName = path.basename(path.dirname(envPath));
    const config = await handleConsulConfig(false, false);
    if (!config.consulUrl) {
      throw new Error('Consul URL is not configured, use --configure to configure');
    }
    if (!config.consulFolder) {
      throw new Error('Consul folder is not configured, use --configure to configure');
    }
    const envNameInput = await input({
      message: 'Enter the project name:',
      default: envName,
    });


    downloadFromConsul(config, envName);
  });

program.command('upload')
  .description('Upload .env file to Consul')
  .option('-p, --path <path>', 'Path to the .env file', path.join(process.cwd(), '.env'))
  .action(async (options) => {
    try {
      const envPath = options.path;
      if (!fs.existsSync(envPath)) {
        throw new Error(`File not found: ${envPath}`);
      }
      const config = await handleConsulConfig(false, false);

      if (!config.consulUrl) {
        throw new Error('Consul URL is not configured, use --configure to configure');
      }
      if (!config.consulFolder) {
        throw new Error('Consul folder is not configured, use --configure to configure');
      }
      
    
      const envName = path.basename(path.dirname(envPath));
      console.log(`Reading .env file: ${envPath}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      const jsonContent = convertEnvToJson(envContent);
      const envNameInput = await input({
        message: 'Enter the project name:',
        default: envName,
      });


      console.log(`Uploading to Consul: ${envNameInput}`);
      await uploadToConsul(config, jsonContent, envNameInput);
      console.log('Upload completed successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
