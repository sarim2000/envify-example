# envify-example

Automatically generate a `.env.example` file from your `.env` without manual copying, pasting, or editing. Push your changes without worrying about exposing sensitive information.

## Features

- Generates `.env.example` from your existing `.env` file
- Supports various `.env` file types (`.env`, `.env.local`, etc.)
- Preserves comments and structure of the original file
- Replaces sensitive values with placeholders

## Installation

Install the package globally using npm:

```bash
npm install -g envify-example
```

## Usage

Run the package in your project directory:

```bash
envify-example [path/to/.env]
```

If no path is specified, it will look for a `.env` file in the current directory.

### Examples

Generate from default `.env` file:
```bash
envify-example
```

Generate from a specific `.env` file:
```bash
envify-example .env.local
```

## How it works

1. Reads your specified `.env` file
2. Replaces sensitive values with placeholders
3. Preserves comments and file structure
4. Creates a new `.env.example` file in the same directory

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.