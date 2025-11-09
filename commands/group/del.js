const isSenderAdmin = require('../../utils/isAdmin');

module.exports = {
  name: 'del',
  alias: ['delete', 'dlt'],
  description: 'Delete a replied message (and command message).',

  execute: async (sock, m, args, { groupMetadata }) => {
    const from = m.key.remoteJid;


    // ✅ Must be a group
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: '⚠️ This command only works in *groups!*' }, { quoted: m });
      return;
    }

      const { isSenderAdmin: senderAdmin, isBotAdmin, participants } = await isSenderAdmin(sock, m, groupMetadata);

    if (!senderAdmin) {
      await sock.sendMessage(from, { 
        text: '❌ Only *group admins* can reset the invite link.' 
      }, { quoted: m });
      return;
    }

    // ✅ Works in groups and private chats
    const quoted = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
    const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;

    if (!quoted) {
      await sock.sendMessage(from, { text: '⚙️ Reply to a *message* you want to delete using `.del`.' }, { quoted: m });
      return;
    }

    try {
      // 🧹 Delete the replied message
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: quoted,
          participant: quotedParticipant,
        },
      });

      // 🧹 Delete the command message itself
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: true,
          id: m.key.id,
        },
      });

    } catch (err) {
      console.error('Delete command error:', err);
      await sock.sendMessage(from, { text: '❌ Failed to delete the message.' }, { quoted: m });
    }
  },
};
