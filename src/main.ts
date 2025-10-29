import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { expandGlob } from "@std/fs";
import { TextlintKernelDescriptor } from "@textlint/kernel";
import { moduleInterop } from "@textlint/module-interop";
import { createLinter, loadLinterFormatter } from "textlint";
import textlintConfig from "../textlintrc.json" with { type: "json" };

// Dynamic imports for CommonJS compatibility
const loadModules = async () => {
  const [
    noEmojiModule,
    noEmphasisModule,
    normalizeWhitespacesModule,
    markdownPluginModule,
    textPluginModule,
  ] = await Promise.all([
    import("@0x6b/textlint-rule-no-emoji"),
    import("@0x6b/textlint-rule-no-emphasis"),
    import("@0x6b/textlint-rule-normalize-whitespaces"),
    import("@textlint/textlint-plugin-markdown"),
    import("@textlint/textlint-plugin-text"),
  ]);

  return {
    noEmojiRule: noEmojiModule.default || noEmojiModule,
    noEmphasisRule: noEmphasisModule.default || noEmphasisModule,
    normalizeWhitespacesRule: normalizeWhitespacesModule.default || normalizeWhitespacesModule,
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
  const { noEmojiRule, noEmphasisRule, normalizeWhitespacesRule, markdownPlugin, textPlugin } =
    await loadModules();

  const ruleModules = {
    "@0x6b/no-emoji": noEmojiRule,
    "@0x6b/no-emphasis": noEmphasisRule,
    "@0x6b/normalize-whitespaces": normalizeWhitespacesRule,
  };

  const rules = [];
  const rulesConfig = {};

  for (const [ruleId, options] of Object.entries(textlintConfig.rules)) {
    if (ruleId.startsWith("@textlint-ja/") || ruleId.startsWith("preset-")) {
      rulesConfig[ruleId] = options;
    } else {
      rules.push({
        ruleId,
        rule: moduleInterop(ruleModules[ruleId]),
        options,
      });
    }
  }

  // Create descriptor programmatically
  const descriptor = new TextlintKernelDescriptor({
    rules,
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
    rulesConfig,
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
