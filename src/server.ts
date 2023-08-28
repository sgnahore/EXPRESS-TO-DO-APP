import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { addDummyDbItems } from "./db";
import filePath from "./filePath";
import { Client } from "pg";

// loading in some dummy items into the database
// (comment out if desired, or change the number)
addDummyDbItems(20);

const client = new Client({ database: "perntodo" });
client.connect();

const app = express();

/** Parses JSON data in a request automatically */
app.use(express.json());
/** To allow 'Cross-Origin Resource Sharing': https://en.wikipedia.org/wiki/Cross-origin_resource_sharing */
app.use(cors());

// read in contents of any environment variables in the .env file
// Must be done BEFORE trying to access process.env...
dotenv.config();

// use the environment variable PORT, or 4000 as a fallback
const PORT_NUMBER = process.env.PORT ?? 4000;

// API info page
app.get("/", (req, res) => {
    const pathToFile = filePath("../public/index.html");
    res.sendFile(pathToFile);
});

// GET /todos
app.get("/todos", async (req, res) => {
    const text = "SELECT * FROM todo";
    const response = await client.query(text);

    res.status(200).json(response.rows);
});

// POST /todos
app.post<{ description: string }>("/todos", async (req, res) => {
    const { description } = req.body;
    const text = "INSERT INTO todo (description) VALUES($1) RETURNING *";
    const values = [description];

    const newToDoEntry = await client.query(text, values);

    res.status(201).json(newToDoEntry.rows[0]);
});

// PUT /todos/:id
app.put<{ id: number }, {}, { description: string }>(
    "/todos/:id",
    async (req, res) => {
        const { id } = req.params;
        const { description } = req.body;

        const updateToDoEntry = {
            text: "UPDATE todo SET description = $1 WHERE id = $2",
            values: [description, id],
        };

        await client.query(updateToDoEntry);

        res.status(200).json("Entry updated");
    }
);

// DELETE /items/:id
app.delete<{ id: string }>("/todos/:id", async (req, res) => {
    const id = req.params.id;
    const text = "DELETE FROM todo WHERE id = $1";
    const values = [id];

    await client.query(text, values);

    res.status(200).json("Entry deleted");
});

// GET /items/:id
// app.get<{ id: string }>("/todos/:id", (req, res) => {});

app.listen(PORT_NUMBER, () => {
    console.log(`Server is listening on port ${PORT_NUMBER}!`);
});
