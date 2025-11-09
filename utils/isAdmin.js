   
   
// function for checking user admin
module.exports = async function isSenderAdmin(sock, m, groupMetadata) {
  try {
    const from = m.key.remoteJid;
    if (!from.endsWith('@g.us')) return false;

    const metadata = groupMetadata || await sock.groupMetadata(from);
    const senderId = m.key.participant || m.participant || m.key.remoteJid;
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    const sender = metadata.participants.find(p => p.id === senderId);
    const bot = metadata.participants.find(p => p.id === botId);

    return {
      isSenderAdmin: !!sender?.admin,
      isBotAdmin: !!bot?.admin,
      participants: metadata.participants,
      metadata
    };
  } catch (err) {
    console.error('Admin check failed:', err);
    return { isSenderAdmin: false, isBotAdmin: false, participants: [], metadata: null };
  }
};
