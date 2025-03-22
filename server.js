const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 5001;
const SOS_FILE = path.join(__dirname, "sos_data.json");
const INCIDENTS_FILE = path.join(__dirname, "incidents_data.json");
const ALERTO_API_KEY = "19f7634e-4577-4536-a036-763aa8a62edb";
const ALERTO_API_URL = "https://alertobuilders.net/api/incidents";

app.use(express.json());
app.use(cors());

let sosList = [];
let incidentsList = [];

async function loadIncidentData() {
    try {
        const data = await fs.readFile(INCIDENTS_FILE, "utf8");
        incidentsList = JSON.parse(data);
    } catch (error) {
        console.log("No existing incident data found, starting fresh.");
        incidentsList = [];
    }
}

async function saveIncidentData() {
    try {
        await fs.writeFile(INCIDENTS_FILE, JSON.stringify(incidentsList, null, 4));
    } catch (error) {
        console.error("Error saving incident data:", error);
    }
}

app.post("/report_incident", async (req, res) => {
    const newIncident = {
        user_id: req.body.user_id,
        type: req.body.type,
        lat: req.body.lat,
        lon: req.body.lon,
        timestamp: new Date().toISOString()
    };

    incidentsList.push(newIncident);
    await saveIncidentData();

    res.json({ message: "Incident reported successfully", data: newIncident });
});

app.get("/get_incidents", (req, res) => {
    res.json(incidentsList);
});

app.get("/alerto_incidents", async (req, res) => {
    try {
        const response = await fetch(ALERTO_API_URL, {
            headers: { "Authorization": `Bearer ${ALERTO_API_KEY}` }
        });
        const alertoIncidents = await response.json();
        res.json([...incidentsList, ...alertoIncidents]);
    } catch (error) {
        console.error("Error fetching Alerto PH incidents:", error);
        res.status(500).json({ error: "Failed to fetch incidents" });
    }
});

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await loadIncidentData();
});
