import "server-only";

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

// Structured JSON logs: easy to search in Vercel, Datadog or any log drain.
function log(level: Level, message: string, fields: Fields = {}) {
  const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, f?: Fields) => log("debug", m, f),
  info: (m: string, f?: Fields) => log("info", m, f),
  warn: (m: string, f?: Fields) => log("warn", m, f),
  error: (m: string, f?: Fields) => log("error", m, f),
};
