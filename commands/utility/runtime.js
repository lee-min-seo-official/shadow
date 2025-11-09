module.exports = {
  name: 'uptime',
  aliases: ['up', 'runtime'],
  description: 'Shows how long the bot has been running.',

  execute: async (sock, m) => {
    const uptimeMs = process.uptime() * 1000;
    const seconds = Math.floor((uptimeMs / 1000) % 60);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

    const uptimeString = `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;

    const message = `
╭───────────────
│ ⏱️ *Bot Uptime Report*
├───────────────
│ 🕒 *Running For:* *${uptimeString}*
╰───────────────
    `;

    await sock.sendMessage(
      m.key.remoteJid,
      { text: message.trim() },
      { quoted: m } // ✅ reply to the message
    );
  },
};
