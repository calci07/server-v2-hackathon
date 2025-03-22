// server.js (Backend)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 5001;
const SOS_FILE = path.join(__dirname, "sos_data.json");
const ALERTO_API_KEY = process.env.ALTERTO_API_KEY || "your-api-key-here";
const ALERTO_API_URL = "https://alertobuilders.net/api/incidents";

app.use(express.json());
app.use(cors());

let sosList = [];

async function loadSOSData() {
    try {
        const data = await fs.readFile(SOS_FILE, "utf8");
        sosList = JSON.parse(data);
    } catch (error) {
        console.log("No existing SOS data found, starting fresh.");
        sosList = [];
    }
}

async function saveSOSData() {
    try {
        await fs.writeFile(SOS_FILE, JSON.stringify(sosList, null, 4));
    } catch (error) {
        console.error("Error saving SOS data:", error);
    }
}

app.post("/sos", async (req, res) => {
    const newSOS = {
        user_id: req.body.user_id,
        lat: req.body.lat,
        lon: req.body.lon,
        timestamp: new Date().toISOString()
    };

    sosList.push(newSOS);
    await saveSOSData();

    res.json({ message: "SOS received", data: newSOS });
});

app.get("/get_sos", (req, res) => {
    res.json(sosList);
});

app.get("/alerto_incidents", async (req, res) => {
    try {
        const response = await fetch(ALERTO_API_URL, {
            headers: { "Authorization": `Bearer ${ALERTO_API_KEY}` }
        });
        const incidents = await response.json();
        res.json(incidents);
    } catch (error) {
        console.error("Error fetching Alerto PH incidents:", error);
        res.status(500).json({ error: "Failed to fetch incidents" });
    }
});

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await loadSOSData();
});
