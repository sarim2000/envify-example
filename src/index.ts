#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import { generateEnvExample, handleConsulConfig, uploadToConsul, convertEnvToJson, downloadFromConsul, loadConfig } from './utils.js';
import chalk from 'chalk';
import { generateCommitMessage } from './commit.js';
import { exec } from 'node:child_process';
import { generatePytestFiles, writePytestFile } from './fastapi-to-pytest.js';

const program = new Command();

program
  .name('env-tool')
  .description('CLI to convert .env files and optionally upload to Consul')
  .version('1.0.0');

program.command('convert')
  .description('Convert .env file to .env.example or .env.json')
  .option('-p, --path <path>', 'Path to the .env file', path.join(process.cwd(), '.env'))
  .option('-t, --type <type>', 'Output type: "example" or "json"', 'example')
  .option('-s, --secret', 'Hide secret values', false)
  .action((options) => {
    const envPath = options.path;
    const envType = options.type as 'example' | 'json';
    const secretMessage = options.secret
      ? 'Secret values will be hidden in the output file.'
      : 'Secret values will be visible in the output file. Use --secret to hide them.';

    console.log(chalk.yellow(`Note: ${secretMessage}`));

    try {
      generateEnvExample(envPath, envType, options.secret);
      console.log(chalk.green(`Successfully converted ${envPath} to ${envType} format.`));
    } catch (error) {
      console.error(chalk.red(`Error converting file: ${error}`));
      process.exit(1);
    }
  });

program.command('configure')
  .description('Configure Consul settings')
  .option('-c, --configure', 'Configure settings')
  .option('-s, --save-config', 'Save configuration for future use')
  .action(async (options) => {
    console.log(chalk.blue('Welcome to the Configuration Wizard!'));
    await handleConsulConfig(options.configure, options.saveConfig);
  });

program.command('download')
  .description('Download .env file from Consul')
  .option('-p, --path <path>', 'Path to the .env file', path.join(process.cwd(), '.env.json'))
  .option('-s, --secret', 'Hide secret values', false)
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


    downloadFromConsul(config, envName, options.secret);
    console.log(chalk.green('Download completed successfully'));
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
      const jsonContent = convertEnvToJson(envContent, false);
      const envNameInput = await input({
        message: 'Enter the project name:',
        default: envName,
      });


      console.log(chalk.blue(`Uploading to Consul: ${envNameInput}`));
      await uploadToConsul(config, jsonContent, envNameInput, false);
      console.log(chalk.green('Upload completed successfully'));
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

program.command('generate-commit-message')
  .description('Generate a commit message for the current branch')
  .action(async () => {
    const config = loadConfig()

    if (config.openaiApiKey === undefined) {
      console.log(chalk.red('OpenAI API key is not configured, use --configure to configure'));
      return;
    }


    const commitMessage = await generateCommitMessage(config.openaiApiKey);
    console.log(chalk.green('Generated commit message:'));
    console.log(chalk.yellow(commitMessage));

    if (commitMessage === 'No changes to commit') {
      console.log(chalk.yellow('No changes to commit. Exiting.'));
      console.log(chalk.yellow("Make sure to add the changes you want to commit using `git add .`"))
      return;
    }

    const { confirm } = await import('@inquirer/prompts');
    const shouldCommit = await confirm({
      message: 'Do you want to commit with this message?',
      default: false
    });

    if (shouldCommit) {
      try {
        const commitResult = await new Promise<string>((resolve, reject) => {
          exec(`git commit -m "${commitMessage}"`, (error, stdout, stderr) => {
            if (error) {
              reject(new Error(error.message));
              return;
            }
            if (stderr) {
              reject(new Error(stderr));
              return;
            }
            resolve(stdout);
          });
        });

        console.log(chalk.green('Commit successful:'));
        console.log(chalk.yellow(commitResult));
      } catch (error) {
        console.log(chalk.red('Commit failed:'));
        console.log(chalk.yellow(error instanceof Error ? error.message : String(error)));
      }
    } else {
      console.log(chalk.blue('Commit cancelled. You can manually commit using:'));
      console.log(chalk.yellow(`git commit -m ${JSON.stringify(commitMessage)}`));
    }
  });

program.command('generate-pytest')
  .description('Generate Pytest  generated-test.json file from a FastAPI project using OpenAPI docs')
  .option('-u, --url <url>', 'URL of the running FastAPI application', 'http://localhost:8000')
  .option('-o, --output <path>', 'Output directory for pytest files', path.join(process.cwd(), 'tests'))
  .action(async (options) => {
    try {
      console.log(chalk.yellow("Warning: FastAPI project should be fully type-safe. Path parameters are not fully supported yet."));
      console.log(chalk.blue('Fetching OpenAPI documentation...'));
      await generatePytestFiles(options.url, options.output);
      console.log(chalk.green('Successfully generated pytest files.'));
      await writePytestFile(options.output);
      console.log(chalk.green('Successfully wrote pytest file.'));
    } catch (error) {
      console.error(chalk.red(`Error generating tests: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
