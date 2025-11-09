const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'help',
  aliases: ['menu', 'commands'],
  description: 'Shows the list of all commands.',

  execute: async (sock, m, args, { commands, config }) => {
    const menuImagePath = path.join(__dirname, '../../data/menu.jpg');
    const prefix = config.prefix;

    // 🔧 Handle setmenu
    if (args[0] === 'set') {
      let imageMessage;

      // 🖼️ 1. Check if current message contains image
      if (m.message?.imageMessage) {
        imageMessage = m.message.imageMessage;
      }

      // 🖼️ 2. If not, check if quoted message is an image
      else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
        imageMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
      }

      if (!imageMessage) {
        await sock.sendMessage(m.key.remoteJid, {
          text: '📸 Reply to or send an image with the command to set the menu background.',
          quoted: m
        });
        return;
      }

      // ✅ Download image buffer manually (for RC6)
      const stream = await downloadContentFromMessage(imageMessage, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      fs.mkdirSync(path.dirname(menuImagePath), { recursive: true });
      fs.writeFileSync(menuImagePath, buffer);

      await sock.sendMessage(m.key.remoteJid, { text: '✅ Menu image updated successfully!', quoted: m });
      return;
    }

    // 🕒 Calculate uptime
    const uptimeMs = process.uptime() * 1000;
    const seconds = Math.floor((uptimeMs / 1000) % 60);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // 📂 Group commands by category
    const grouped = {};
    for (const [name, cmd] of commands) {
      const parts = cmd.__filePath?.split(path.sep) || [];
      const category = (parts[parts.length - 2] || 'General') + ' Commands';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(cmd);
    }

    // 📜 Build help text
    const readMore = String.fromCharCode(8206).repeat(4001);
    let helpText = `
╭───────────────╮
│     *Sнα∂σω MENU*  
╰───────────────╯
🌐 *Prefix:* ${prefix}
⏱️ *Uptime:* ${uptimeString}
👤 *Name:* Shadow

${readMore}
`;

    for (const [category, cmds] of Object.entries(grouped)) {
      helpText += `\n📂 *${category.toUpperCase()}*\n`;
      for (const cmd of cmds) {
        helpText += `  • ${prefix}${cmd.name} — ${cmd.description || 'No description'}\n`;
      }
    }

    // 🖼️ Send menu with or without image
    if (fs.existsSync(menuImagePath)) {
      const imageBuffer = fs.readFileSync(menuImagePath);
      await sock.sendMessage(m.key.remoteJid, {
        image: imageBuffer,
        caption: helpText.trim(),
      }, { quoted: m });
    } else {
      await sock.sendMessage(m.key.remoteJid, { text: helpText.trim() }, { quoted: m });
    }
  },
};
