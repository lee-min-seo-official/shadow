const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'setnamegc',
  description: 'Change the group name (admin only).',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;

    // ⚠️ Must be in a group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { 
        text: '⚠️ This command only works in *groups!*' 
      }, { quoted: m });
      return;
    }

    // 🧠 Admin validation
    const { isSenderAdmin: senderAdmin, isBotAdmin } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { 
        text: '❌ Only *group admins* can change the group name!' 
      }, { quoted: m });
      return;
    }

    // 📝 Get new name
    const newName = args.join(' ').trim();
    if (!newName) {
      await sock.sendMessage(from, { 
        text: `⚙️ Usage: \`${config.prefix}setnamegc <new_name>\`` 
      }, { quoted: m });
      return;
    }

    try {
      // ✅ Update group subject
      await sock.groupUpdateSubject(from, newName);

      await sock.sendMessage(from, { 
        text: `✅ *Group name updated successfully!*\n\n📛 New Name: *${newName}*` 
      }, { quoted: m });

    } catch (err) {
      console.error('setnamegc error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Failed to update the group name. Make sure I have permission.' 
      }, { quoted: m });
    }
  },
};
