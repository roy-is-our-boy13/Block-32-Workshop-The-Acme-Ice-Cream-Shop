require("dotenv").config();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || "postgres://royperlman:7026@localhost/the_acme_notes_db");
const express = require('express');
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

// READ all of the flavors.
app.get("/api/flavors", async (req, res, next) => 
{
    try
    {
        const SQL = `
            SELECT * FROM flavors ORDER BY created_at DESC
        `;

        const response = await client.query(SQL); 
        res.send(response.rows)
    }
    catch(error)
    {
        next(error);
    }
});

//READ just a single flavor by an id.
app.get("/api/flavors/:id", async (req, res, next) => 
{
    try 
    {
        const SQL = `
            SELECT * FROM flavors WHERE id = $1
        `;
        const response = await client.query(SQL, [req.params.id]);

        if (response.rows.length === 0)
        { 
            return res.sendStatus(404)
        };
        res.send(response.rows[0]);
    } 
    catch (error) 
    {
        next(error);
    }
});

// CREATE  a new flavor of ice cream.
app.post("/api/flavors", async (req, res, next) => 
{
    try
    {
        const SQL = `
            
            INSERT INTO flavors(name, is_favorite)
            VALUES($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.ranking]);
        res.status(201).send(response.rows[0]);
    }
    catch(error)
    {
        next(error);
    }
});

// UPDATE an exsiting ice cream flavor.
app.put("/api/flavors/:id", async(req, res, next) => 
{
    try 
    {
        const SQL = `
            UPDATE flavors
            SET name = $1, is_favorite = $2, updated_at = now()
            WHERE id = $3
            RETURNING *
        `;
        const response = await client.query(SQL, 
        [
            req.body.txt, 
            req.body.ranking, 
            req.params.id
        ]);
  
        res.send(response.rows[0]);
    }
    catch(error)
    {
        next(error);
    }
});

// DELETE a single ice cream flavor. 
app.delete("/api/flavors/:id", async(req, res, next) => 
{
    try 
    {
        const SQL = `
            DELETE FROM flavors 
            WHERE id = $1
        `;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    }
    catch(error)
    {
        next(error);
    }
  });


const init = async () => 
{
    await client.connect();
    
    let SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            is_favorite BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
    `;

    await client.query(SQL);
    console.log("tables created");

    SQL = `
        INSERT INTO flavors(name, is_favorite) VALUES('Chocolate', true);
        INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', false);
        INSERT INTO flavors(name, is_favorite) VALUES('Strawberry', false);
        INSERT INTO flavors(name, is_favorite) VALUES('Birthday Cake', true);
        INSERT INTO flavors(name, is_favorite) VALUES('Mint', true);
        `;

    await client.query(SQL);

    console.log("data seeded");

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();