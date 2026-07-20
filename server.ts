import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// API endpoint for Tamim's Interactive AI Assistant & Guestbook
app.post("/api/gemini/assistant", async (req, res) => {
  const { message, chatHistory } = req.body;

  if (!ai) {
    return res.status(503).json({
      error: "Gemini API কনফিগার করা নেই। অনুগ্রহ করে Secrets-এ GEMINI_API_KEY যুক্ত করুন।",
    });
  }

  try {
    // Provide a detailed persona of Tamim to Gemini so it can answer queries as his smart assistant
    const systemPrompt = `আপনি হলেন "মোঃ তানভীর আহম্মেদ তামীম" (Md. Tanvir Ahmed Tamim) এর ব্যক্তিগত এআই সহকারী (AI Assistant)। তামীমের তৈরি করা এই পোর্টফোলিও ওয়েবসাইটে দর্শনার্থীদের বিভিন্ন প্রশ্নের উত্তর দেওয়া এবং তামীম সম্পর্কে সঠিক তথ্য উপস্থাপন করাই আপনার দায়িত্ব।

তামীম সম্পর্কে তথ্যসমূহ:
- নাম: মোঃ তানভীর আহম্মেদ তামীম (Md. Tanvir Ahmed Tamim)
- পরিচয়: শিক্ষার্থী ও প্রযুক্তিপ্রেমী।
- বর্তমান শিক্ষা প্রতিষ্ঠান: বগুড়া সরকারি কলেজ (Bogra Government College) - এইচএসসি (HSC) দ্বিতীয় বর্ষ / চলমান।
- পূর্ববর্তী শিক্ষা: এসএসসি (SSC) পাস করেছেন কৃতিত্বের সাথে।
- লক্ষ্য ও ক্যারিয়ার ভাবনা: ভবিষ্যতে একজন অত্যন্ত দক্ষ সফটওয়্যার ডেভেলপার (Software Developer) হওয়া।
- আগ্রহ ও শখ: প্রযুক্তি, ওয়েব ডেভেলপমেন্ট (HTML, CSS, JS, React ইত্যাদি) এবং নতুন নতুন বিষয় শেখা।
- পরিবার: বাবার নাম "আব্দুল মাজেদ" (Abdul Majed), যিনি পেশায় একজন সম্মানিত "প্রধান শিক্ষক" (Headmaster)।
- যোগাযোগের তথ্য:
  * ইমেইল: mdtanvirtamim2021@gmail.com
  * মোবাইল: 01704-340219
  * ফেসবুক: Tanvir Ahmad Tamim

নির্দেশনা:
1. সবসময় অত্যন্ত ভদ্র, নম্র, মার্জিত এবং আন্তরিকভাবে বাংলায় কথা বলবেন।
2. যদি কোনো দর্শনার্থী তামীমের শিক্ষা, পরিবার, লক্ষ্য, শখ বা ইমেইল/ফোন নম্বর জানতে চান, তবে উপরের তক্ষ্য থেকে সঠিক ও সুনির্দিষ্ট উত্তর দিন।
3. যদি দর্শনার্থী কোনো শুভকামনা বা শুভেচ্ছা বার্তা লেখেন, তবে তামীমের পক্ষ থেকে কৃতজ্ঞতা প্রকাশ করুন এবং সুন্দর ভাষায় ধন্যবাদ দিন।
4. কথা বলার সময় "আমি তামীমের এআই সহকারী..." হিসেবে নিজেকে পরিচয় দিন এবং তামীমের পক্ষ হয়ে আন্তরিক উত্তর দিন।
5. উত্তরগুলো সংক্ষিপ্ত, সুন্দর ও সহজে পড়ার উপযোগী রাখবেন (২-৪ বাক্যের মধ্যে)। অপ্রাসঙ্গিক বা মনগড়া তথ্য দেবেন না।
6. কোনো মেডিকেল বা অনাকাঙ্ক্ষিত পেশাদার পরামর্শ দেবেন না।`;

    const formattedHistory = (chatHistory || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add current message to the conversation
    const contents = [
      ...formattedHistory,
      { role: "user", parts: [{ text: `System Instruction Summary: ${systemPrompt}\n\nUser Question: ${message}` }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const reply = response.text || "আমি তামীমের সহকারী হিসেবে দুঃখিত যে এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন!";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return res.status(500).json({
      error: "দুঃখিত, এআই সহকারীর সাথে যোগাযোগ করা সম্ভব হচ্ছে না।",
      details: error.message,
    });
  }
});

// Configure Vite or production static file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
