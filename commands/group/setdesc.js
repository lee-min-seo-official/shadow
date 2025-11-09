const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'setdesc',
  description: 'Change the group description (admin only).',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;

    // 🚫 Must be inside a group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { 
        text: '⚠️ This command only works inside *group chats!*' 
      }, { quoted: m });
      return;
    }

    // 🧩 Check admin privileges
    const { isSenderAdmin: senderAdmin, isBotAdmin } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { 
        text: '❌ Only *group admins* are allowed to change the description.' 
      }, { quoted: m });
      return;
    }

    // ✍️ New description input
    const newDesc = args.join(' ').trim();
    if (!newDesc) {
      await sock.sendMessage(from, { 
        text: `💡 Usage: \`${config.prefix}setdesc <new_description>\`` 
      }, { quoted: m });
      return;
    }

    try {
      // 📝 Update group description
      await sock.groupUpdateDescription(from, newDesc);

      await sock.sendMessage(from, { 
        text: `✅ *Group description updated successfully!*\n\n🗒️ New Description:\n${newDesc}` 
      }, { quoted: m });

    } catch (err) {
      console.error('setdesc error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Failed to update group description. Please check my permissions.' 
      }, { quoted: m });
    }
  },
};
