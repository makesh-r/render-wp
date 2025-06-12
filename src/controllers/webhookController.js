const { VERIFY_TOKEN } = require('../config');
// const { db } = require('../lib/firebaseAdmin');
const { getGptAssistantReply, db } = require('../services/openaiService');
const { sendWhatsAppMessage } = require('../services/whatsappService');

async function verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        res.sendStatus(403);
    }
}

async function handleWebhook(req, res) {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    const phoneNumberId = changes?.value?.metadata?.phone_number_id;

    if (message) {
        const from = message.from;
        const userMessage = message.text.body;
        const reply = await getGptAssistantReply(userMessage, from, phoneNumberId);
        await sendWhatsAppMessage(from, reply);

        try {
            const querySnapshot = await db.collection("threadMap")
                .where("numberId", "==", from)
                .where("botId", "==", phoneNumberId)
                .limit(1)
                .get();

            const docRef = querySnapshot.docs[0].ref;
            await docRef.update({
                history: admin.firestore.FieldValue.arrayUnion(
                    { role: "user", content: userMessage },
                    { role: "assistant", content: reply }
                ),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("User", from, ":", userMessage);
            console.log("Assistant", reply);
        } catch (error) {
            console.log("Error updating threadMap", error);
        }
    }

    res.sendStatus(200);
}

module.exports = { verifyWebhook, handleWebhook };
