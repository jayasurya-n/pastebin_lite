import express from "express"
import { nanoid } from "nanoid";
import 'dotenv/config'

import redis from "../redis.js";

const app = express();

app.use(express.json());

// app.get('/', (req, res) => {
//     res.status(200);
//     res.send("Welcome to root URL of Server");
// });

// ping redis server
app.get('/api/healthz', async (req, res) => {
    try {
        await redis.ping();
        res.status(200).json({ "ok": true });
    }
    catch {
        return res.status(500).json({ "ok": false });
    }
});

// create a paste
app.post('/api/pastes', async (req, res) => {
    const { content, ttl_seconds, max_views } = req.body;

    if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Invalid content" });
    }

    if (ttl_seconds !== undefined && (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)) {
        return res.status(400).json({ error: "Invalid ttl_seconds" });
    }

    if (max_views !== undefined && (!Number.isInteger(max_views) || max_views < 1)) {
        return res.status(400).json({ error: "Invalid max_views" });
    }

    const id = nanoid();
    const now = Date.now();

    const paste = {
        id: id,
        content: content,
        expires_at: ttl_seconds ? now + ttl_seconds * 1000 : null,
        max_views: max_views ? max_views : null,
        used_views: 0,
    };

    await redis.set(`paste:${id}`, JSON.stringify(paste));
    res.status(201).json({
        id: id,
        url: `${req.protocol}://${req.get("host")}/p/${id}`
    });
});


// fetch a paste
app.get('/api/pastes/:id', async (req, res) => {
    const key = `paste:${req.params.id}`;
    const data = await redis.get(key);

    if (!data) {
        return res.status(404).json({ error: "Paste not found" });
    }

    const paste = JSON.parse(data);
    const isTest = process.env.TEST_MODE == 1 && req.headers['x-test-now-ms'];
    const now = isTest
        ? Number(req.headers['x-test-now-ms'])
        : Date.now();

    // console.log("now:", now);
    if (paste.max_views !== null && paste.used_views >= paste.max_views) {
        return res.status(404).json({ error: "View Limit Exceeded" });
    }
    if (paste.expires_at !== null && now >= paste.expires_at) {
        return res.status(404).json({ error: "Time Limit Exceeded" });
    }

    paste.used_views += 1;
    await redis.set(key, JSON.stringify(paste));

    res.status(200).json({
        content: paste.content,
        remaining_views: paste.max_views ? (paste.max_views - paste.used_views) : null,
        expires_at: paste.expires_at

    });

});

// view a paste
app.get('/p/:id', async (req, res) => {
    const key = `paste:${req.params.id}`;
    const data = await redis.get(key);

    if (!data) {
        return res.status(404).json({ error: "Paste not found" });
    }

    const paste = JSON.parse(data);
    const isTest = process.env.TEST_MODE == 1 && req.headers['x-test-now-ms'];
    const now = isTest
        ? Number(req.headers['x-test-now-ms'])
        : Date.now();

    // console.log("now:", now);
    if (paste.max_views !== null && paste.used_views >= paste.max_views) {
        return res.status(404).json({ error: "View Limit Exceeded" });
    }
    if (paste.expires_at !== null && now >= paste.expires_at) {
        return res.status(404).json({ error: "Time Limit Exceeded" });
    }

    paste.used_views += 1;
    await redis.set(key, JSON.stringify(paste));
    const escaped = paste.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    res.send(`<pre>${escaped}</pre>`);

});

if (!process.env.VERCEL) {
    app.listen(process.env.PORT || 3000, (error) => {
        if (!error) {
            console.log("server is running at localhost:" + process.env.PORT);
        } else {
            console.log("Error: server cannot start", error);
        }
    });
};

