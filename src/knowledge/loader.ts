import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_ROOT = path.join(__dirname, "../../knowledge");

export interface KnowledgeChunk {
  file: string;
  topic: string;
  content: string;
}

const cache = new Map<string, KnowledgeChunk[]>();

/**
 * Load knowledge chunks for a specific session.
 * Falls back to "default" folder if session folder doesn't exist.
 */
export function loadKnowledge(sessionId: string): KnowledgeChunk[] {
  const cacheKey = sessionId;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const chunks: KnowledgeChunk[] = [];

  // Try session-specific folder first, then default
  const dirs = [
    path.join(KNOWLEDGE_ROOT, sessionId),
    path.join(KNOWLEDGE_ROOT, "default"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const sections = content.split(/^##\s+/m);
      const topic = file.replace(/\.md$/, "");

      for (const section of sections) {
        const trimmed = section.trim();
        if (!trimmed) continue;
        if (section === sections[0] && sections[0]) {
          chunks.push({ file, topic, content: trimmed });
        } else {
          const lines = trimmed.split("\n");
          const subTopic = lines[0].trim();
          chunks.push({
            file,
            topic: `${topic} > ${subTopic}`,
            content: lines.slice(1).join("\n").trim(),
          });
        }
      }
    }
    // If we found files in session folder, stop (don't fallback to default)
    if (chunks.length > 0) break;
  }

  cache.set(cacheKey, chunks);
  return chunks;
}

/**
 * List available knowledge topics (session folder names)
 */
export function listKnowledgeTopics(): string[] {
  if (!fs.existsSync(KNOWLEDGE_ROOT)) return [];
  return fs
    .readdirSync(KNOWLEDGE_ROOT)
    .filter((f) => fs.statSync(path.join(KNOWLEDGE_ROOT, f)).isDirectory());
}

/**
 * Search knowledge base for a session + query
 */
export function searchKnowledge(
  sessionId: string,
  query: string,
  limit: number = 3
): KnowledgeChunk[] {
  const chunks = loadKnowledge(sessionId);
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  const scored = chunks.map((chunk) => {
    const c = chunk.content.toLowerCase();
    let score = 0;

    // Exact phrase match (highest)
    if (c.includes(q)) score += 50;

    // Individual word matches
    for (const word of words) {
      const regex = new RegExp(word, "gi");
      const matches = (chunk.content.match(regex) || []).length;
      score += matches * 5;
    }

    // Title/topic keywords get bonus
    const t = chunk.topic.toLowerCase();
    for (const word of words) {
      if (t.includes(word)) score += 10;
    }

    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.chunk);
}
