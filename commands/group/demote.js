const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'demote',
  description: 'Demote an admin back to member (admin only).',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;

    // ✅ Must be used in a group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { 
        text: '⚠️ This command only works in *group chats!*' 
      }, { quoted: m });
      return;
    }

    // 🛡️ Permission checks
    const { isSenderAdmin: senderAdmin, isBotAdmin } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { 
        text: '❌ Only *group admins* can use this command!' 
      }, { quoted: m });
      return;
    }

    // 🎯 Detect target
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target = mentioned || quoted || args[0];

    if (!target) {
      await sock.sendMessage(from, { 
        text: `💡 Usage: *${config.prefix}demote @user* or reply to an admin's message.` 
      }, { quoted: m });
      return;
    }

    try {
      // ⬇️ Demote user
      await sock.groupParticipantsUpdate(from, [target], 'demote');

      await sock.sendMessage(from, { 
        text: `⬇️ *User demoted successfully!*\n@${target.split('@')[0]} is no longer an admin.`, 
        mentions: [target],
      }, { quoted: m });
    } catch (err) {
      console.error('demote error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Failed to demote user. Make sure I have admin rights and the target is an admin.' 
      }, { quoted: m });
    }
  },
};
