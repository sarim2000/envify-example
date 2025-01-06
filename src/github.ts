import fs from 'fs';
import path from 'path';
import { exec } from 'node:child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GithubSecret {
    name: string;
    value: string;
}

export async function readEnvFile(envPath: string = '.env'): Promise<Record<string, string>> {
    const envFilePath = path.resolve(process.cwd(), envPath);
    if (!fs.existsSync(envFilePath)) {
        throw new Error(`Environment file not found at ${envFilePath}`);
    }
    
    const content = fs.readFileSync(envFilePath, 'utf8');
    const envVars: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key) {
                const value = valueParts.join('=').trim();
                envVars[key.trim()] = value;
            }
        }
    });
    
    return envVars;
}

export async function generateGithubSecrets(envPath: string = '.env'): Promise<GithubSecret[]> {
    const envVars = await readEnvFile(envPath);
    return Object.entries(envVars).map(([key, value]) => ({
        name: key,
        value: value
    }));
}

export async function createGithubSecretCommand(secret: GithubSecret): Promise<string> {
    // Format the secret name to match GitHub's requirements
    const formattedName = secret.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    return `gh secret set ${formattedName} --body="${secret.value}"`;
}

export async function setGithubSecrets(secrets: GithubSecret[]): Promise<void> {
    for (const secret of secrets) {
        const command = await createGithubSecretCommand(secret);
        try {
            await execAsync(command);
            console.log(`✅ Successfully set secret: ${secret.name}`);
        } catch (error) {
            console.error(`❌ Failed to set secret: ${secret.name}`);
            console.error(error);
        }
    }
}
