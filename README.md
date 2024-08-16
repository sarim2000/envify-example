# envify-example

A CLI tool to convert .env files, generate .env.example or .env.json files, and optionally upload to or download from Consul.

## Features

- Convert .env files to .env.example or .env.json
- Upload .env files to Consul
- Download .env files from Consul
- Configure Consul settings

## Installation

Install the package globally using npm:

```bash
npm install -g envify-example
```

## Usage

After installation, you can use the `envify-example` command in your terminal. Here are the available commands:

### Convert .env file

Convert a .env file to .env.example or .env.json:

```bash
envify-example convert [options]

Options:
  -p, --path <path>  Path to the .env file (default: current directory/.env)
  -t, --type <type>  Output type: "example" or "json" (default: "example")
```

### Configure Consul

Configure Consul settings:

```bash
envify-example configure-consul [options]

Options:
  -c, --configure    Configure Consul settings
  -s, --save-config  Save Consul configuration for future use
```

### Download from Consul

Download .env files from Consul:

```bash
envify-example download [options]

Options:
  -c, --consul-config  Path to Consul configuration file
  -o, --output <path>  Output path for the downloaded .env file
```

### Upload to Consul

Upload .env files to Consul:

```bash
envify-example upload [options]

Options:
  -c, --consul-config  Path to Consul configuration file
  -i, --input <path>  Path to the .env file to upload
