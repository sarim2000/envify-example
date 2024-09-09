import { exec } from 'child_process';
import OpenAI from 'openai';
import fs from 'fs';

const systemPrompt = `
# Concise Conventional Commits System Prompt

Generate commit messages in this format:

\`\`\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\`\`\`

Guidelines:
1. Types: \`fix:\`(bug fixes), \`feat:\`(new features), \`build:\`, \`chore:\`, \`ci:\`, \`docs:\`, \`style:\`, \`refactor:\`, \`perf:\`, \`test:\`
2. Optional scope in parentheses: e.g., \`feat(parser):\`
3. Description: Concise, imperative mood, capitalized, no period
4. Breaking changes: Add \`!\` after type / scope, use "BREAKING CHANGE:" footer
5. Optional body for detailed explanations
6. Optional footers in git trailer format

Key points:
- First line(type + scope + description) ≤ 72 characters
  - Use imperative: "add" not "added"
    - Wrap body and footer at 72 characters
- Do not give any escape characters like \\n or \\" in the response.
- Just return the commit message.
- Keep it short and concise. Do not be over descriptive.

Analyze code changes and create appropriate commit messages following these rules.
`;

async function generateCommitMessage(apiKey: string): Promise<string> {
  // Get the git diff
  const diff = await new Promise<string>((resolve, reject) => {
    exec('git diff --cached', (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Error: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });

  // Filter only changed lines (starting with '+' or '-')
  const changedLines = diff.split('\n')
    .filter(line => line.startsWith('+') || line.startsWith('-'))
    .join('\n');

  
  // Initialize th  e LLM (assuming you're using OpenAI's ChatGPT)
  const llm = new OpenAI({
    apiKey: apiKey,
  });


  // Prompt the LLM to generate a commit message
  const response = await llm.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Based on the following git diff, generate a concise and informative commit message:\n\n${changedLines}
        \n\n
        
        If the changes are not enough to commit, please return "No changes to commit".
        `,
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  return response.choices[0].message.content || '';
}

export { generateCommitMessage };
