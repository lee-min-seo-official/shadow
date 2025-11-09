const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'link',
  aliases: ['linkgc', 'invite', 'gclink'],
  description: 'Get the current group invite link.',

  execute: async (sock, m) => {
    const from = m.key.remoteJid;

    // 🚫 Must be inside a group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { 
        text: '⚠️ This command only works inside *group chats!*' 
      }, { quoted: m });
      return;
    }

    try {
      // 🔗 Fetch current invite code
      const code = await sock.groupInviteCode(from);
      const metadata = await sock.groupMetadata(from);
      const groupName = metadata.subject || 'Unnamed Group';

      const link = `https://chat.whatsapp.com/${code}`;

      await sock.sendMessage(from, { 
        text: `🔗 *${groupName} Invite Link:*\n\n${link}\n\n💡 Share this link to invite new members.` 
      }, { quoted: m });
    } catch (err) {
      console.error('linkgc error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Failed to fetch the group invite link. Try again later.' 
      }, { quoted: m });
    }
  },
};
