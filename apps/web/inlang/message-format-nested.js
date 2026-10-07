/**
 * inlang plugin: `plugin.inlang.messageFormat` with nested-object support.
 *
 * Drop-in for `@inlang/plugin-message-format` (loadMessages is reimplemented
 * here because the SDK imports modules as data: URLs, so this file cannot
 * have its own imports). `en.json` uses the standard nested i18n layout and
 * keys are flattened to underscore-joined ids —
 * `{ "design": { "title": "x" } }` becomes `design_title`, so call sites use
 * `m.design_title()`. Flat keys pass through unchanged.
 */

const flatten = (obj, prefix = "", out = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    if (prefix === "" && key === "$schema") continue;
    const id = prefix ? `${prefix}_${key}` : key;
    if (value && typeof value === "object") {
      flatten(value, id, out);
    } else {
      out[id] = value;
    }
  }
  return out;
};

const parsePattern = (value) => {
  const parts = [];
  const regex = /\{([^}]+)\}/g;
  let match;
  let last = 0;
  while ((match = regex.exec(value)) !== null) {
    const text = value.slice(last, match.index);
    if (text.length > 0) parts.push({ type: "Text", value: text });
    parts.push({ type: "VariableReference", name: match[1] });
    last = match.index + match[0].length;
  }
  const rest = value.slice(last);
  if (rest.length > 0) parts.push({ type: "Text", value: rest });
  return parts;
};

const plugin = {
  id: "plugin.inlang.messageFormat",
  displayName: { en: "Message Format (nested)" },
  description: {
    en: "Reads messages/{languageTag}.json; nested objects are flattened to underscore-joined ids.",
  },
  loadMessages: async ({ settings, nodeishFs }) => {
    const pathPattern = settings["plugin.inlang.messageFormat"].pathPattern;
    const messages = {};
    for (const languageTag of settings.languageTags) {
      let file;
      try {
        file = await nodeishFs.readFile(pathPattern.replace("{languageTag}", languageTag), {
          encoding: "utf-8",
        });
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      for (const [id, value] of Object.entries(flatten(JSON.parse(file)))) {
        const message = messages[id] ?? { id, alias: {}, selectors: [], variants: [] };
        message.variants.push({ languageTag, match: [], pattern: parsePattern(value) });
        messages[id] = message;
      }
    }
    return Object.values(messages);
  },
};

export default plugin;
