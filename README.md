# envify-example CLI

A command-line interface tool for generating conentional github commit messages using OpenAI and managing environment variables, converting .env files, and interacting with Consul.

![generate-commit-message](https://raw.githubusercontent.com/sarim2000/envify-example/main/doc/screenshot.png)

## Installation

```bash
npm install -g envify-example
```

## Usage



```bash
envify-example [command] [options]
```

## Commands

### Generate a commit message

```bash
envify-example commit
```

### convert

Convert a .env file to .env.example or .env.json.

```bash
envify-example convert [options]
```

Options:
- `-p, --path <path>`: Path to the .env file (default: current directory's .env)
- `-t, --type <type>`: Output type: "example" or "json" (default: "example")

Examples:
```bash
envify-example convert
envify-example convert -p /path/to/.env -t json
```

### configure-consul

Configure Consul settings.

```bash
envify-example configure-consul [options]
```

Options:
- `-c, --configure`: Configure Consul settings
- `-s, --save-config`: Save Consul configuration for future use

Example:
```bash
envify-example configure-consul -c -s
```

### download

Download .env file from Consul.

```bash
envify-example download [options]
```

Options:
- `-p, --path <path>`: Path to save the downloaded .env file (default: current directory's .env)

Example:
```bash
envify-example download
envify-example download -p /path/to/save/.env
```

### upload

Upload .env file to Consul.

```bash
envify-example upload [options]
```

Options:
- `-p, --path <path>`: Path to the .env file to upload (default: current directory's .env)

Example:
```bash
envify-example upload
envify-example upload -p /path/to/.env
```

## Global Options

- `-V, --version`: Output the version number
- `-h, --help`: Display help for command

## Examples

1. Convert a .env file to .env.example:
   ```bash
   envify-example convert
   ```

2. Convert a .env file to .env.json:
   ```bash
   envify-example convert -t json
   ```

3. Configure Consul settings and save for future use:
   ```bash
   envify-example configure-consul -c -s
   ```

4. Upload a .env file to Consul:
   ```bash
   envify-example upload
   ```

5. Download a .env.json file from Consul:
   ```bash
   envify-example download
   ```

## Notes

- Make sure to configure Consul settings using the `configure-consul` command before attempting to upload or download files.
- The tool assumes that your .env file is in the current working directory unless specified otherwise using the `-p` or `--path` option.

## Troubleshooting

If you encounter any issues, please check the following:

1. Ensure that you have the necessary permissions to read/write files in the specified directories.
2. Verify that your Consul configuration is correct and that you have network access to the Consul server.
3. Make sure that the .env file exists in the specified location when using the `upload` command.

For any further assistance, please open an issue on the project's GitHub repository.
