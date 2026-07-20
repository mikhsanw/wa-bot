import fs from "fs/promises";
import path from "path";

type AdapterProps = {
  credentialsPath?: string;
};

export class FileAdapter {
  private credentialsPath: string;

  constructor(props?: AdapterProps) {
    this.credentialsPath = props?.credentialsPath || "./wa_credentials";
  }

  async init(): Promise<void> {
    await fs.mkdir(path.resolve(this.credentialsPath), { recursive: true });
  }

  private _sessionFolder(sessionId: string): string {
    return path.resolve(this.credentialsPath, `${sessionId}_credentials`);
  }

  private async _ensureFolder(folder: string): Promise<void> {
    await fs.mkdir(folder, { recursive: true });
  }

  async readData(sessionId: string, key: string): Promise<string | null> {
    const folder = this._sessionFolder(sessionId);
    const filePath = path.join(folder, `${key}.json`);
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return data;
    } catch {
      return null;
    }
  }

  async writeData(sessionId: string, key: string, _category: string, data: string): Promise<void> {
    const folder = this._sessionFolder(sessionId);
    await this._ensureFolder(folder);
    const filePath = path.join(folder, `${key}.json`);
    await fs.writeFile(filePath, data, "utf-8");
  }

  async deleteData(sessionId: string, key: string): Promise<void> {
    const folder = this._sessionFolder(sessionId);
    const filePath = path.join(folder, `${key}.json`);
    try {
      await fs.unlink(filePath);
    } catch { /* ignored */ }
  }

  async clearData(sessionId: string): Promise<void> {
    const folder = this._sessionFolder(sessionId);
    const backupFolder = folder + "_bak_" + Date.now();
    try {
      await fs.rename(folder, backupFolder);
      console.log(`[FileAdapter] Session ${sessionId}: moved to ${path.basename(backupFolder)} instead of deleting`);
    } catch { /* folder may not exist */ }
  }

  async listSessions(): Promise<string[]> {
    await this.init();
    const resolved = path.resolve(this.credentialsPath);
    const entries = await fs.readdir(resolved, { withFileTypes: true });
    const sessions = entries
      .filter((e) => e.isDirectory() && e.name.endsWith("_credentials"))
      .map((e) => e.name.replace(/_credentials$/, ""));
    return sessions;
  }
}
