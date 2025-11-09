const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'promote',
  description: 'Promote a group member to admin (admin only).',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;

    // ✅ Must be used in a group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { 
        text: '⚠️ This command only works in *group chats!*' 
      }, { quoted: m });
      return;
    }

    // 🛡️ Check admin privileges
    const { isSenderAdmin: senderAdmin, isBotAdmin } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { 
        text: '❌ Only *group admins* can use this command.' 
      }, { quoted: m });
      return;
    }
    
    // 🎯 Target detection
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target = mentioned || quoted || args[0];

    if (!target) {
      await sock.sendMessage(from, { 
        text: `💡 Usage: *${config.prefix}promote @user* or reply to a user's message.` 
      }, { quoted: m });
      return;
    }

    try {
      // 🧩 Promote user
      await sock.groupParticipantsUpdate(from, [target], 'promote');

      await sock.sendMessage(from, { 
        text: `👑 *Promotion Successful!*\n@${target.split('@')[0]} is now an *Admin.*`, 
        mentions: [target],
      }, { quoted: m });
    } catch (err) {
      console.error('promote error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Failed to promote user. Please check permissions and try again.' 
      }, { quoted: m });
    }
  },
};
