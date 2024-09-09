import { input } from "@inquirer/prompts";
import path from "path";
import os from "os";
import fs from "fs";
import { Config } from "./types.js";

const CONFIG_FILE = path.join(os.homedir(), '.env-generator-config.json');

export function loadConfig(): Partial<Config> {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return {};
}

export function saveConfigFile(config: Partial<Config>) {
  try {
    console.log('Saving config:', config);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('Config saved successfully');
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
}

export function generateEnvExample(envPath: string, envType: 'example' | 'json', secret: boolean = false) {
  const envDir = path.dirname(envPath);
  const envFileName = ".env";
  const envExamplePath = path.join(envDir, `${envFileName}.${envType === "json" ? "json" : "example"}`);

  if (!fs.existsSync(envPath)) {
    console.error(`${envFileName} file not found`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');

  const envExampleContent = envType === "json"
    ? convertEnvToJson(envContent, secret)
    : envContent
      .split('\n')
      .map(line => {
        const [key, ...valueParts] = line.split('=');
        const trimmedKey = key.trim();
        if (trimmedKey && !trimmedKey.startsWith('#')) {
          return `${trimmedKey}=${secret ? '*****' : valueParts.join('=').trim()}`;
        }
        return line;
      })
      .join('\n');

  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log(`${envExamplePath} file generated successfully`);
}

export async function uploadToConsul(config: Config, envContent: string, envName: string, secret: boolean = false) {
  const { consulUrl, consulToken, consulFolder } = config;
  try {
    const response = await fetch(
      `${consulUrl}/v1/kv/${consulFolder}/${envName}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: secret ? JSON.stringify(JSON.parse(envContent)) : envContent,
      }
    );
    if (response.status === 200) {
      console.log('Successfully uploaded to Consul');
    } else {
      console.error('Failed to upload to Consul');
    }
  } catch (error) {
    console.error('Error uploading to Consul:', error);
  }
}

export async function downloadFromConsul(config: Config, envName: string, secret: boolean = false) {
  const { consulUrl, consulFolder } = config;
  try {
    const response = await fetch(
      `${consulUrl}/v1/kv/${consulFolder}/${envName}`,
    );
    const data = await response.json();
    const decodedValue = Buffer.from(data[0].Value, 'base64').toString('utf-8');
    fs.writeFileSync(path.join(process.cwd(), '.env'), convertJsonToEnv(JSON.parse(decodedValue), secret));
    console.log('Successfully downloaded from Consul');
  } catch (error) {
    console.error('Error downloading from Consul:', error);
  }
}

export async function handleConsulConfig(configure: boolean, saveConfig: boolean): Promise<Config> {
  let config: Config = {
    consulUrl: loadConfig().consulUrl,
    consulToken: loadConfig().consulToken,
    consulFolder: loadConfig().consulFolder,
    envType: 'default',
    openaiApiKey: loadConfig().openaiApiKey,
  };

  if (configure) {
    const consulUrl = await input({
      message: 'Enter Consul URL:',
      default: config.consulUrl,
    });

    const consulFolder = await input({
      message: 'Enter Consul Folder:',
      default: config.consulFolder,
    });

    const openaiApiKey = await input({
      message: 'Enter OpenAI API key:',
      default: config.openaiApiKey,
    });

    config = { ...config, consulUrl, consulFolder, openaiApiKey };

    if (saveConfig) {
      saveConfigFile({
        consulUrl: config.consulUrl,
        consulFolder: config.consulFolder,
        openaiApiKey: config.openaiApiKey,
      });
      console.log('Configuration saved for future use.');
    }
  }

  return config;
} 

export function convertEnvToJson(envContent: string, secret: boolean = false): string {
  return JSON.stringify(
    envContent.split('\n').reduce((acc: Record<string, string>, line) => {
      const [key, ...valueParts] = line.split('=');
      const trimmedKey = key.trim();
      if (trimmedKey && !trimmedKey.startsWith('#')) {
        const value = valueParts.join('=').trim();
        acc[trimmedKey] = secret ? value.length > 4 ? `${value.slice(0, 4)}****` : '******' : value;
      }
      return acc;
    }, {}),
    null,
    2
  )
}

export function convertJsonToEnv(jsonContent: string, secret: boolean = false): string {
  return Object.entries(jsonContent).map(([key, value]) => `${key}=${secret ? '*****' : value}`).join('\n');
}
