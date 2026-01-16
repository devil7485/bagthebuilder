import fs from "fs";
import path from "path";
import { BuilderRecord, RepoRecord } from "./types";

const DATA_PATH = path.join(process.cwd(), "scanner", "data.json");

type Store = {
  builders: Record<string, BuilderRecord>;
  repos: Record<string, RepoRecord>;
};

export function loadStore(): Store {
  if (!fs.existsSync(DATA_PATH)) {
    return { builders: {}, repos: {} };
  }

  const raw = fs.readFileSync(DATA_PATH, "utf8").trim();

  if (!raw) {
    return { builders: {}, repos: {} };
  }

  try {
    return JSON.parse(raw);
  } catch {
    console.warn("⚠️ Corrupted data.json, resetting store");
    return { builders: {}, repos: {} };
  }
}

export function saveStore(store: Store) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2));
}
