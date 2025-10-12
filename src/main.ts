import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { Glob } from "bun";
import { createLinter, loadLinterFormatter, loadTextlintrc } from "textlint";
import configFilePath from "../textlintrc.json" with { type: "file" };

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
    fix: {
      type: "boolean",
      default: false,
    },
    formatter: {
      type: "string",
      default: "stylish",
    },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
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
`);
  process.exit(0);
}

let filesToLint: string[];

if (positionals.length === 0) {
  const glob = new Glob("**/*.{md,txt}");
  filesToLint = [];
  for await (const file of glob.scan(".")) {
    filesToLint.push(file);
  }
} else {
  filesToLint = positionals;
}

const descriptor = await loadTextlintrc({ configFilePath });
const linter = createLinter({ descriptor });
const formatter = await loadLinterFormatter({ formatterName: values.formatter });

if (values.fix) {
  const results = await linter.fixFiles(filesToLint);

  for (const result of results) {
    if (result.output !== undefined) {
      await writeFile(result.filePath, result.output);
    }
  }

  console.log(formatter.format(results));
} else {
  const results = await linter.lintFiles(filesToLint);
  console.log(formatter.format(results));
}
