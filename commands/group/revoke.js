const isSenderAdmin = require('../../utils/isAdmin');
const config = require('../../config');

module.exports = {
  name: 'revoke',
  aliases: ['resetlink', 'revokeinv', 'revokeurl'],
  description: 'Revoke and generate a new group invite link.',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;

    // 🧩 Must be used in a group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { 
        text: '⚠️ This command can only be used in *group chats!*' 
      }, { quoted: m });
      return;
    }

    // 🛡️ Check admin rights
    const { isSenderAdmin: senderAdmin, isBotAdmin } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { 
        text: '❌ Only *group admins* can reset the invite link.' 
      }, { quoted: m });
      return;
    }


    try {
      // 🔄 Revoke + generate new link
      await sock.groupRevokeInvite(from);
      const newCode = await sock.groupInviteCode(from);
      const metadata = groupMetadata || await sock.groupMetadata(from);
      const groupName = metadata.subject || 'Unnamed Group';

      const newLink = `https://chat.whatsapp.com/${newCode}`;

      await sock.sendMessage(from, { 
        text: `✅ *${groupName}* invite link has been *revoked* and refreshed.\n\n🔗 New Invite:\n${newLink}` 
      }, { quoted: m });

    } catch (err) {
      console.error('revoke error:', err);
      await sock.sendMessage(from, { 
        text: '❌ Failed to revoke or regenerate the group invite link.' 
      }, { quoted: m });
    }
  },
};
