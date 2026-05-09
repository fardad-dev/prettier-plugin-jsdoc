import { parsers as typescriptParsers } from "prettier/plugins/typescript";

// Mimics how prettier-plugin-tailwindcss composes: on every preprocess/parse
// call it re-resolves the underlying parser by walking `options.plugins` and
// `Object.assign`-ing each plugin's parser for this name on top of its own. The
// resulting object's preprocess/parse therefore points at whichever plugin sits
// later in the chain. The important detail is that this lookup can re-enter
// another plugin's parser during the same format call.
const PLUGIN_NAME = "prettier-plugin-fake-chaining";
const baseParser = typescriptParsers.typescript;

function waitForNextTask() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function resolveUnderlyingParser(parserName, options) {
  const merged = { ...baseParser };

  if (!options || !options.plugins) {
    return merged;
  }

  for (const plugin of options.plugins) {
    if (
      typeof plugin !== "object" ||
      plugin === null ||
      plugin.name === PLUGIN_NAME ||
      !plugin.parsers ||
      !(parserName in plugin.parsers)
    ) {
      continue;
    }

    Object.assign(merged, plugin.parsers[parserName]);
  }

  return merged;
}

export const name = PLUGIN_NAME;

export const parsers = {
  typescript: {
    ...baseParser,

    preprocess(text, options) {
      const underlying = resolveUnderlyingParser("typescript", options);

      return underlying.preprocess
        ? underlying.preprocess(text, options)
        : text;
    },

    async parse(text, options) {
      await waitForNextTask();

      const underlying = resolveUnderlyingParser("typescript", options);

      return underlying.parse(text, options);
    },
  },
};
