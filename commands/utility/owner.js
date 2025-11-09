module.exports = {
  name: 'owner',
  aliases: ['creator', 'dev'],
  description: 'Sends the bot owner’s contact card.',

  execute: async (sock, m) => {
    const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:Lee Mira
ORG:Shadow Bot Developer;
TEL;type=CELL;type=VOICE;waid=447440323279:+44 7440 323279
END:VCARD
    `.trim();

    // Send contact card
    await sock.sendMessage(
      m.key.remoteJid,
      {
        contacts: {
          displayName: "Lee Mira",
          contacts: [{ vcard }],
        },
      },
      { quoted: m } 
    );
  },
};
