const isSenderAdmin = require('../../utils/isAdmin');

module.exports = {
  name: 'kick',
  alias: ['remove'],
  description: 'Remove a member from the group (admins only).',

  execute: async (sock, m, args, context = {}) => {
    const from = m.key.remoteJid;

    // ✅ Must be group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: '⚠️ This command only works in *groups!*' }, { quoted: m });
      return;
    }

    // 🧩 Get group metadata (fallback if not provided)
    const groupMetadata = context.groupMetadata || await sock.groupMetadata(from);

    // 🛡️ Permission checks
    const { isSenderAdmin: senderAdmin, isBotAdmin, participants } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { text: '❌ Only *group admins* can remove members.' }, { quoted: m });
      return;
    }



    // 🎯 Identify target
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target = mentioned || quoted || args[0];

    if (!target) {
      await sock.sendMessage(from, { text: '⚙️ Usage: `.kick @user` or reply to their message.' }, { quoted: m });
      return;
    }

    // 🧾 Get participant info
    const targetParticipant = participants.find(p => p.id === target);
    const senderParticipant = participants.find(p => p.id === (m.participant || m.key.participant));

    // 🚫 Prevent removing another admin
    if (targetParticipant && (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin')) {
      await sock.sendMessage(from, {
        text: '🚫 You cannot remove another *admin*!',
      }, { quoted: m });
      return;
    }

    // 🚫 Prevent self-removal
    if (target === senderParticipant?.id) {
      await sock.sendMessage(from, {
        text: '🤦 You cannot remove yourself!',
      }, { quoted: m });
      return;
    }

    try {
      // ✅ Kick the member
      await sock.groupParticipantsUpdate(from, [target], 'remove');

      await sock.sendMessage(from, {
        text: `🚷 *Removed successfully!*\n@${target.split('@')[0]}`,
        mentions: [target],
      }, { quoted: m });

    } catch (err) {
      console.error('Kick command error:', err);
      await sock.sendMessage(from, { text: '❌ Failed to remove the user. Make sure I have admin rights.' }, { quoted: m });
    }
  },
};
