const axios = require('axios');
const admin = require("firebase-admin");
const { OPENAI_API_KEY, ASSISTANT_ID } = require('../config');
// const { db } = require('../lib/firebaseAdmin.js');

admin.initializeApp({
    credential: admin.credential.cert("/etc/secrets/firebaseConfig.json"),
});

const db = admin.firestore();

const OPENAI_API_BASE = 'https://api.openai.com/v1';
const headers = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2'
};

async function getOrCreateThreadId(numberId, botId) {
    // Step 1: Check Firestore for existing thread
    const threadQuery = await db.collection("threadMap")
        .where("numberId", "==", numberId)
        .where("botId", "==", botId)
        .limit(1)
        .get();

    if (!threadQuery.empty) {
        const doc = threadQuery.docs[0];
        return {
            threadId: doc.data().threadId,
            docRef: doc.ref
        };
    }

    // Step 2: Create a new thread with OpenAI API
    const threadRes = await axios.post(`${OPENAI_API_BASE}/threads`, {}, { headers });
    const threadId = threadRes.data.id;

    // Step 3: Store it in Firestore
    const docRef = db.collection("threadMap").doc();
    await docRef.set({
        numberId,
        botId,
        threadId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
        threadId,
        docRef
    };
}

async function getGptAssistantReply(message, numberId, botId) {

    try {

        const { threadId } = await getOrCreateThreadId(numberId, botId);
        console.log(`Thread ID: ${threadId}`);

        // Step 1: Add message to the thread
        await axios.post(
            `${OPENAI_API_BASE}/threads/${threadId}/messages`,
            {
                role: 'user',
                content: message,
            },
            { headers }
        );

        // Step 2: Run the assistant
        const runRes = await axios.post(
            `${OPENAI_API_BASE}/threads/${threadId}/runs`,
            {
                assistant_id: ASSISTANT_ID,
            },
            { headers }
        );
        const runId = runRes.data.id;

        // Step 3: Poll for completion
        let runStatus = 'in_progress';
        while (runStatus === 'in_progress' || runStatus === 'queued') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const statusRes = await axios.get(
                `${OPENAI_API_BASE}/threads/${threadId}/runs/${runId}`,
                { headers }
            );
            runStatus = statusRes.data.status;
        }

        if (runStatus !== 'completed') {
            throw new Error(`Run failed with status: ${runStatus}`);
        }

        // Step 4: Retrieve assistant response
        const messagesRes = await axios.get(
            `${OPENAI_API_BASE}/threads/${threadId}/messages`,
            { headers }
        );

        const messages = messagesRes.data.data;
        const assistantReply = messages.find(msg => msg.role === 'assistant')?.content[0]?.text?.value;

        return assistantReply?.trim() || 'No reply from assistant.';
    } catch (err) {
        console.error('Error calling OpenAI Assistant API:', err.response?.data || err.message);
        return 'Sorry, there was an error processing your message.';
    }
}

async function generateEmailReply(body) {
    try {
        const response = await axios.post(
            `${OPENAI_API_BASE}/chat/completions`,
            {
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: 'Reply to this email in a helpful and professional tone.' },
                    { role: 'user', content: body }
                ]
            },
            { headers }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating email reply:', error.response?.data || error.message);
        return null;
    }
}

async function updateThreadHistory(from, phoneNumberId, userMessage, reply) {
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
}

module.exports = { getGptAssistantReply, generateEmailReply, updateThreadHistory };