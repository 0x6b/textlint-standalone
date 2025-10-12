# textlint-standalone

Opinionated, single-binary textlint for my own use, built with Bun.

## Prerequisite

- [Bun](https://bun.sh/) 1.3.0 or later

## Installation

```console
$ bun install
$ bun run build
```

This creates a standalone executable, `dist/textlint`, with embedded configuration and dependencies.

## Usage

```
Usage: textlint [options] [files...]

Options:
  -h, --help               Show this help message
  --fix                    Automatically fix problems and write changes to files
  --formatter <name>       Specify output formatter (default: "stylish")
                           Available: stylish, compact, json, checkstyle, junit, tap

Examples:
  textlint README.md                    Lint a specific file
  textlint                              Lint all *.md and *.txt files recursively
  textlint --fix                        Fix all files automatically
  textlint --formatter compact          Use compact formatter
  textlint --fix --formatter json file  Fix with JSON output
```

## Development

Run directly from source during development:

```console
$ bun run src/main.ts [options] [files...]
```

### Formatting and Linting

Format code with [Biome](https://biomejs.dev/):

```console
$ bun run format # Format and write changes
$ bun run lint   # Lint and fix issues
$ bun run check  # Run both format and lint
```

### Clean Up

Remove all generated files and dependencies i.e. `node_modules`, `dist`, and `bun.lock`:

```console
$ bun run clean
```

## License

MIT. See [LICENSE](./LICENSE) for detail.
