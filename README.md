# textlint-standalone

Opinionated, single-binary textlint for my own use, built with Deno.

## Prerequisite

- [Deno](https://deno.com/) 2.5.4 or later

## Installation

```console
$ deno install
$ deno task build
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
$ deno task dev [options] [files...]
```

### Formatting and Linting

Format code with [Biome](https://biomejs.dev/):

```console
$ deno task format # Format and write changes
$ deno task lint   # Lint and fix issues
$ deno task check  # Run both format and lint
```

### Clean Up

Remove all generated files and dependencies i.e. `node_modules` and `dist`:

```console
$ deno task clean
```

## License

MIT. See [LICENSE](./LICENSE) for detail.
