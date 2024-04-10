/** Routes for companies */

const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT * FROM invoices`);

        return res.json({invoices: results.rows});
    } catch(e) {
        return next(e);
    }
});

router.get("/:id", async (req, res, next) => {
    try{
        const results = await db.query(
            `SELECT i.*, c.name AS company_name, c.description FROM invoices i
            JOIN companies c ON c.code=i.comp_code
            WHERE id=$1`,
            [req.params.id]
        )

        if(results.rows.length===0) throw new ExpressError("Invoice not found", 404);
        
        return res.json({invoice: results.rows[0]});

    } catch(e) {
        return next(e);
    }
})

router.post("/", async (req, res, next) => {
    try{
        const { comp_code, amt } = req.body;
        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
             VALUES ($1, $2)
             RETURNING *`,
             [comp_code, amt]
        );
        
        return res.status(201).json({invoice: result.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.put("/:id", async (req, res, next) => {
    try{ 
        const result = await db.query(
            `UPDATE invoices SET amt=$1
            WHERE id=$2
            RETURNING *`,
            [req.body.amt, req.params.id]
        );

        if(result.rows.length===0) throw new ExpressError("Invoice not found", 404);
        
        return res.json(result.rows[0]);
        
    } catch(e) {
        return next(e);
    }
});

router.delete("/:id", async (req, res, next) => {
    try{
        const checkInv = await db.query("SELECT * FROM invoices WHERE id=$1", [req.params.id]);
        if(checkInv.rows.length===0) throw new ExpressError("Invoice not found", 404);

        const results = await db.query(
            `DELETE FROM invoices WHERE id=$1`, [req.params.id]
        );
        return res.send({msg: "DELETED"});
        
    }catch(e) {
        return next(e);
    }
})

module.exports = router;