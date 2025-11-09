const fs = require("fs");
const path = require("path");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = {
  name: "pint",
  description: "Fetch Pinterest images and send them as a grouped album",

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
      return sock.sendMessage(
        jid,
        { text: "⚙️ Usage: .pint <search term>\nExample: .pint anime girls" },
        { quoted: msg }
      );
    }

    try {
      const tempDir = "./temp";
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const res = await fetch(
        `https://api-rebix.vercel.app/api/pinterest?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!data?.data || data.data.length === 0) {
        return sock.sendMessage(jid, { text: "❌ No Pinterest results found." }, { quoted: msg });
      }

      const results = data.data.slice(0, 10);

      const filePaths = await Promise.all(
        results.map(async (item, index) => {
          try {
            const imgRes = await fetch(item.image);
            if (!imgRes.ok) throw new Error("Failed to download");

            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const filePath = path.join(tempDir, `${Date.now()}_${index}.jpg`);
            fs.writeFileSync(filePath, buffer);
            return filePath;
          } catch (err) {
            console.error("Image download failed:", err);
            return null;
          }
        })
      );

      const validPaths = filePaths.filter(Boolean);

      if (validPaths.length === 0) {
        return sock.sendMessage(jid, { text: "⚠️ Couldn't download any images." }, { quoted: msg });
      }

      for (const filePath of validPaths) {
        await sock.sendMessage(jid, { image: { url: filePath } }, { quoted: msg });
      }

      validPaths.forEach((filePath) => fs.unlink(filePath, () => {}));
    } catch (err) {
      console.error("Pinterest command error:", err);
      await sock.sendMessage(
        jid,
        { text: "❌ Failed to fetch Pinterest images. Try again later." },
        { quoted: msg }
      );
    }
  },
};
