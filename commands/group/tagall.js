const isSenderAdmin = require('../../utils/isAdmin');

module.exports = {
  name: 'tagall',
  description: 'Mention all group members with a stylish message.',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;

    // ✅ Group-only check
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: '⚠️ This command only works in *groups!*' }, { quoted: m });
      return;
    }

    // ✅ Admin check using utils
    const { isSenderAdmin: senderAdmin, isBotAdmin, participants } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { text: '❌ You must be an *admin* to use this command!' }, { quoted: m });
      return;
    }

    // 🗣️ Get sender and message
    const pushName = m.pushName || 'Unknown';
    const customMsg = args.join(' ').trim();

    // 🎨 Build header
    let message = `╭───❏ *GROUP BROADCAST*\n`;
    message += `│ 👤 *Admin:* ${pushName}\n`;
    if (customMsg) {
      message += `│ 💬 *Message:* ${customMsg}\n`;
    }
    message += `╰───────────────❏\n\n`;

    // 📢 Tag list
    const mentions = participants.map(p => p.id);
    for (const p of participants) {
      const num = p.id.split('@')[0];
      message += `➤ @${num}\n`;
    }

    // 🚀 Send message
    await sock.sendMessage(from, { text: message.trim(), mentions }, { quoted: m });
  },
};
