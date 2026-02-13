import { readFile, writeFile, exists, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";

const DB_DIR = "ASF Docket";
const DB_FILE = "docket.db";

export async function loadDbFile(): Promise<Uint8Array | null> {
  try {
    const dirExists = await exists(DB_DIR, { baseDir: BaseDirectory.AppData });
    if (!dirExists) return null;
    return await readFile(`${DB_DIR}/${DB_FILE}`, {
      baseDir: BaseDirectory.AppData,
    });
  } catch {
    return null;
  }
}

export async function saveDbFile(data: Uint8Array): Promise<void> {
  await mkdir(DB_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
  await writeFile(`${DB_DIR}/${DB_FILE}`, data, {
    baseDir: BaseDirectory.AppData,
  });
}
