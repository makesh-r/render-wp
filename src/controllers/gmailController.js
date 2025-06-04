const { sendEmail } = require('../services/gmailService');
const { generateEmailReply } = require('../services/openaiService');

async function handleGmailWebhook(req, res) {
    try {
        console.log("req.body.message?.data: ", req.body.message?.data);
        const decodedData = req.body.message?.data
            ? JSON.parse(Buffer.from(req.body.message.data, 'base64').toString())
            : null;

        console.log("Decoded message data:", decodedData);

        if (!decodedData?.historyId) {
            console.log("Missing historyId in decoded message");
            return res.status(400).send('Missing historyId');
        }

        const historyId = parseInt(decodedData.historyId);
        const emailAddress = decodedData.emailAddress;


        // const historyId = req.body.message?.data
        //     ? parseInt(Buffer.from(req.body.message.data, 'base64').toString())
        //     : null;

        if (!historyId) {
            console.log("Missing historyId in request body");
            return res.status(400).send('Missing historyId');
        }

        // Step 1: Get latest email
        const { data: messagesList } = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread',
            maxResults: 1,
        });

        if (!messagesList.messages || messagesList.messages.length === 0) return res.sendStatus(204);

        const messageId = messagesList.messages[0].id;
        const { data: message } = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
        });

        const headers = message.payload.headers;
        const from = headers.find(h => h.name === 'From')?.value;
        const subject = headers.find(h => h.name === 'Subject')?.value;
        const bodyPart = message.payload.parts?.find(p => p.mimeType === 'text/plain');
        const body = bodyPart
            ? Buffer.from(bodyPart.body.data, 'base64').toString()
            : 'No message body found.';

        console.log("Email body:", body);

        // Step 2: Send to LLM
        const llmResponse = generateEmailReply(body);

        const replyText = llmResponse.data.choices[0].message.content;

        console.log("Email reply:", replyText);

        // // Step 3: Send reply
        // await sendEmail(from, `Re: ${subject}`, replyText);

        // // Step 4: Mark email as read
        // await gmail.users.messages.modify({
        //     userId: 'me',
        //     id: messageId,
        //     requestBody: { removeLabelIds: ['UNREAD'] },
        // });

        res.sendStatus(200);
    } catch (err) {
        console.error('Error in gmail-notify handler:', err);
        res.status(500).send('Failed to process email');
    }
}

module.exports = {
    handleGmailWebhook,
};