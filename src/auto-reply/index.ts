import { searchKnowledge, loadKnowledge, KnowledgeChunk } from "../knowledge/loader";

const LLM_API_URL = process.env.LLM_API_URL || "";
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

const BASE_SYSTEM_PROMPT = `Anda adalah Asisten Virtual yang membantu menjawab pertanyaan masyarakat.

Jawab hanya berdasarkan konteks knowledge base yang diberikan.
Jika pertanyaan tidak bisa dijawab dari konteks, katakan "Maaf, informasi tersebut belum tersedia di knowledge base kami."
Gunakan bahasa Indonesia yang sopan, ringkas, dan mudah dipahami masyarakat.
Jika pertanyaan di luar kewenangan atau tidak memiliki dasar yang jelas, jelaskan keterbatasan tersebut dan jangan membuat informasi.`;

export interface ReplyResult {
  answered: boolean;
  reply: string;
  source: string;
  method: "faq" | "llm" | "none";
  topic?: string;
}

/**
 * Try to answer a question using session-specific knowledge base.
 */
export async function autoReply(
  text: string,
  sessionId: string
): Promise<ReplyResult> {
  const cleaned = text.replace(/[^\w\s]/g, " ").trim();
  if (!cleaned) return { answered: false, reply: "", source: "", method: "none" };

  // Step 1: FAQ keyword match (session-aware)
  const faqResult = matchFAQ(cleaned, sessionId);
  if (faqResult.answered) return faqResult;

  // Step 2: Knowledge search
  const results = searchKnowledge(sessionId, cleaned, 3);
  if (results.length > 0) {
    const reply = formatContextReply(results, cleaned);
    return {
      answered: true,
      reply,
      source: results.map((r) => r.topic).join(", "),
      method: "faq",
      topic: results[0]?.topic,
    };
  }

  // Step 3: LLM RAG (if configured & session has knowledge)
  const hasKnowledge = loadKnowledge(sessionId).length > 0;
  if (LLM_API_URL && hasKnowledge) {
    return llmRAG(cleaned, sessionId);
  }

  return {
    answered: false,
    reply: "",
    source: "",
    method: "none",
  };
}

function matchFAQ(query: string, sessionId: string): ReplyResult {
  const q = query.toLowerCase().trim();

  // Session-specific FAQ patterns
  const patterns: [RegExp, string][] = [];

  if (sessionId === "kpu-siak") {
    patterns.push(
      [/kpu kabupaten siak|apa itu kpu|kpu itu apa/, "KPU Kabupaten Siak adalah lembaga penyelenggara Pemilu di Kabupaten Siak."],
      [/tugas kpu|apa tugas kpu|fungsi kpu/, "KPU Kabupaten Siak bertugas menyelenggarakan seluruh tahapan Pemilu dan Pilkada, menyusun daftar pemilih, sosialisasi, pendidikan pemilih, hingga mengelola logistik Pemilu."],
      [/ppid|informasi publik|permohonan informasi/, "PPID adalah layanan keterbukaan informasi publik di KPU Kabupaten Siak yang melayani permohonan informasi penyelenggaraan Pemilu."],
      [/badan adhoc|ppk|pps|kpps|seleksi/, "Masyarakat dapat mengikuti seleksi badan adhoc yang diumumkan secara resmi oleh KPU. Pantau website dan media sosial KPU Kabupaten Siak."],
      [/pindah memilih|pindah pilih|dpthp/, "Pemilih dapat mengajukan pindah memilih sesuai syarat dan jadwal yang ditetapkan. Ajukan ke KPU setempat sebelum batas waktu."],
      [/visi misi|visi|misi/, "Visi: Menjadi penyelenggara Pemilu yang mandiri, profesional, berintegritas, transparan, dan akuntabel. Misi: Meningkatkan kompetensi, menyelenggarakan Pemilu sesuai aturan, efektif, optimalisasi IT, partisipasi, dan pelayanan terbaik."],
      [/keuangan|logistik|pengadaan|bmn|pembayaran|aset/, "Subbagian Keuangan, Umum, dan Logistik menangani: pengelolaan keuangan, anggaran, administrasi pembayaran, aset/BMN, pengadaan, rumah tangga, kendaraan dinas, persuratan, dan logistik Pemilu."],
      [/hukum|tahapan pemilu|pencalonan|rekapitulasi|sengketa|ppk|pps|pkpu/, "Subbagian Teknis Penyelenggaraan Pemilu dan Hukum menangani: persiapan tahapan Pemilu, keputusan KPU, perjanjian kerja sama, dokumentasi hukum, advokasi, dan sengketa kepemiluan."],
      [/sidalih|sirekap|silon|sipol|silog|sidakam|aplikasi kpu|data|website|renja|rkakl/, "Subbagian Perencanaan, Data, dan Informasi menangani: rencana kerja, program, anggaran, data, TI, website, aplikasi KPU (Sidalih, Sirekap, dll), laporan kinerja, dan statistik Pemilu."],
      [/sosialisasi|pendidikan pemilih|ppid|media|magang|kerja sama|narasumber|humas|sdm/, "Subbagian Partisipasi, Hubungan Masyarakat, dan SDM menangani: sosialisasi Pemilu, pendidikan pemilih, humas, media sosial, publikasi, kemitraan, administrasi SDM, dan pelayanan informasi publik (PPID)."],
      [/jabatan fungsional|penata kelola|pranata|arsiparis|fungsional/, "Kelompok Jabatan Fungsional: Penata Kelola Pemilu, Pranata Komputer, Arsiparis, Analis SDM, Perencana, Pranata Humas, dan Auditor."],
      [/berakhlak|nilai asn/, "ASN di KPU berpedoman pada BerAKHLAK: Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif."],
      [/jam pelayanan|jam kerja|hari kerja/, "Jam pelayanan: Senin–Jumat, mengikuti ketentuan pemerintah daerah dan KPU RI."],
      [/produk hukum|pkpu|peraturan kpu/, "KPU melaksanakan tugas berdasarkan UUD 1945, UU Pemilu/Pilkada, PKPU, Keputusan KPU, dan Surat Dinas KPU."]
    );
  }

  // Global patterns (all sessions)
  patterns.push(
    [/halo|hai|pagi|siang|sore|test|tes/, "Halo! Ada yang bisa saya bantu? Silakan tanyakan informasi yang Anda perlukan."]
  );

  for (const [pattern, answer] of patterns) {
    if (pattern.test(q)) {
      return { answered: true, reply: answer, source: `faq:${sessionId}`, method: "faq" };
    }
  }

  return { answered: false, reply: "", source: "", method: "faq" };
}

function formatContextReply(results: KnowledgeChunk[], query: string): string {
  return results.map((r) => r.content).join("\n\n");
}

async function llmRAG(query: string, sessionId: string): Promise<ReplyResult> {
  try {
    const context = searchKnowledge(sessionId, query, 5);
    if (context.length === 0) {
      return { answered: false, reply: "", source: "", method: "llm" };
    }

    const contextText = context
      .map((c) => `[${c.topic}]\n${c.content}`)
      .join("\n\n");

    const response = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: BASE_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Konteks:\n${contextText}\n\nPertanyaan: ${query}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) throw new Error(`LLM API error: ${response.status}`);

    const data: any = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return {
      answered: !!reply,
      reply:
        reply || "Maaf, tidak bisa menjawab pertanyaan saat ini.",
      source: context.map((c) => c.topic).join(", "),
      method: "llm",
    };
  } catch (e) {
    console.error("LLM RAG error:", e);
    return { answered: false, reply: "", source: "", method: "llm" };
  }
}
