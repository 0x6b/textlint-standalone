import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { expandGlob } from "@std/fs";
import { TextlintKernelDescriptor } from "@textlint/kernel";
import { moduleInterop } from "@textlint/module-interop";
import { createLinter, loadLinterFormatter } from "textlint";

// Dynamic imports for CommonJS compatibility
const loadModules = async () => {
  const [
    noEmojiModule,
    normalizeWhitespacesModule,
    aiWritingModule,
    ngWordModule,
    jaTechnicalWritingModule,
    markdownPluginModule,
    textPluginModule,
  ] = await Promise.all([
    import("@0x6b/textlint-rule-no-emoji"),
    import("@0x6b/textlint-rule-normalize-whitespaces"),
    import("@textlint-ja/textlint-rule-preset-ai-writing"),
    import("textlint-rule-ng-word"),
    import("textlint-rule-preset-ja-technical-writing"),
    import("@textlint/textlint-plugin-markdown"),
    import("@textlint/textlint-plugin-text"),
  ]);

  return {
    noEmojiRule: noEmojiModule.default || noEmojiModule,
    normalizeWhitespacesRule: normalizeWhitespacesModule.default || normalizeWhitespacesModule,
    aiWritingPreset: aiWritingModule.default || aiWritingModule,
    ngWordRule: ngWordModule.default || ngWordModule,
    jaTechnicalWritingPreset: jaTechnicalWritingModule.default || jaTechnicalWritingModule,
    markdownPlugin: markdownPluginModule.default || markdownPluginModule,
    textPlugin: textPluginModule.default || textPluginModule,
  };
};

async function main() {
  const { values, positionals } = parseArgs({
    args: Deno.args,
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
    filesToLint = [];
    for await (const file of expandGlob("**/*.{md,txt}")) {
      filesToLint.push(file.path);
    }
  } else {
    filesToLint = positionals;
  }

  // Load modules dynamically
  const { noEmojiRule, normalizeWhitespacesRule, ngWordRule, markdownPlugin, textPlugin } =
    await loadModules();

  // Create descriptor programmatically
  const descriptor = new TextlintKernelDescriptor({
    rules: [
      {
        ruleId: "@0x6b/no-emoji",
        rule: moduleInterop(noEmojiRule),
        options: true,
      },
      {
        ruleId: "@0x6b/normalize-whitespaces",
        rule: moduleInterop(normalizeWhitespacesRule),
        options: true,
      },
      {
        ruleId: "ng-word",
        rule: moduleInterop(ngWordRule),
        options: true,
      },
    ],
    filterRules: [],
    plugins: [
      {
        pluginId: "markdown",
        plugin: moduleInterop(markdownPlugin),
      },
      {
        pluginId: "text",
        plugin: moduleInterop(textPlugin),
      },
    ],
    rulesConfig: {
      "@textlint-ja/preset-ai-writing": true,
      "preset-ja-technical-writing": true,
    },
  });

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
}

main().catch(console.error);
