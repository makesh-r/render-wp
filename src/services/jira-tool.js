require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(bodyParser.json());

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
}));

// ─────────────────────────────────────────────────────────────
// Helper: Create issue in Jira
async function createJiraIssue({ summary, description, issueType }) {
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

    const payload = {
        fields: {
            project: {
                key: process.env.JIRA_PROJECT_KEY,
            },
            summary,
            description,
            issuetype: {
                name: issueType || 'Task',
            },
        },
    };

    const res = await axios.post(
        `https://${process.env.JIRA_DOMAIN}/rest/api/3/issue`,
        payload,
        {
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }
    );

    return res.data;
}

// ─────────────────────────────────────────────────────────────
// POST /create-issue — takes natural language and creates a Jira ticket
app.post('/create-issue', async (req, res) => {
    const userInput = req.body.query;

    try {
        // Ask GPT to parse user intent
        const response = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that extracts Jira issue details.' },
                { role: 'user', content: `Create a Jira ticket from this: ${userInput}. Give output as JSON: { "summary": "...", "description": "...", "issueType": "Task|Bug|Story" }` },
            ],
        });

        const jsonString = response.data.choices[0].message.content;
        const issueData = JSON.parse(jsonString);

        const jiraResponse = await createJiraIssue(issueData);

        res.json({ success: true, issueKey: jiraResponse.key, url: `https://${process.env.JIRA_DOMAIN}/browse/${jiraResponse.key}` });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send('Failed to create Jira issue');
    }
});

// ─────────────────────────────────────────────────────────────
// GET /issue/:key — fetches issue details
app.get('/issue/:key', async (req, res) => {
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

    try {
        const response = await axios.get(
            `https://${process.env.JIRA_DOMAIN}/rest/api/3/issue/${req.params.key}`,
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    Accept: 'application/json',
                },
            }
        );

        const issue = response.data;
        res.json({
            key: issue.key,
            summary: issue.fields.summary,
            description: issue.fields.description,
            status: issue.fields.status.name,
        });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send('Failed to fetch Jira issue');
    }
});

app.listen(3000, () => {
    console.log('Jira agent running at http://localhost:3000');
});


// JIRA_EMAIL=your_email@example.com
// JIRA_API_TOKEN=your_jira_api_token
// JIRA_DOMAIN=your-domain.atlassian.net
// JIRA_PROJECT_KEY=ABC
// OPENAI_API_KEY=your_openai_api_key
