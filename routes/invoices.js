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
        const { id } = req.params;

        // Checking invoice exists, and allows us to check if it is already paid/check the paid_date
        const inv = await db.query(
            `SELECT * FROM invoices WHERE id=$1`, [id]
        )

        // Throw error if invoice not found
        if(inv.rows.length===0) throw new ExpressError("Invoice not found", 404);
        
        const { amt, paid } = req.body;

        let paid_date;
        if(paid){
            // If paying unpaid invoice, set paid_date to to today
            paid_date = new Date(Date.now());
        }else if(!paid){
            // If unpaying, set paid_date to null
            paid_date = null;
        }else{
            // Else keep current paid_date
            paid_date = inv.rows[0].paid_date;
        }

        const result = await db.query(
            `UPDATE invoices SET amt=$1, paid=$3, paid_date=$4
            WHERE id=$2
            RETURNING *`,
            [amt, req.params.id, paid, paid_date]
        );

        // if(result.rows.length===0) throw new ExpressError("Invoice not found", 404);
        
        return res.json({invoice: result.rows[0]});
        
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