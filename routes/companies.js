/** Routes for companies */

// Remember, need to import express in order to 
// use Router(), which in turn is needed for making our routes
// outside of app.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// Remember, all the routes here will be prefixed in app.js 
// with "/companies" thanks to the Router() function and app.use()
router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT * FROM companies`);
        // return res.json({companies: results.rows});
        return res.json({companies: results.rows});
    }catch(e){
        next(e);
    }
})

// PART 2
// router.get("/:code", async (req, res, next) => {
//     try{
//         const results = await db.query(
//             `SELECT * FROM companies WHERE code=$1`, [req.params.code]
//         );
//         if(results.rows.length === 0) throw new ExpressError('Company not found', 404);
        
//         return res.json({company: results.rows[0]});
//     } catch(e){
//         next(e);
//     }
// })

// PART 3
router.get("/:code", async (req, res, next) => {
    try{
        const companyResults = await db.query(
            `SELECT * FROM companies WHERE code=$1`, [req.params.code]
        );

        if(companyResults.rows.length === 0) throw new ExpressError('Company not found', 404);
        
        const invoiceResults = await db.query(
            `SELECT * FROM invoices WHERE comp_code=$1`, [req.params.code]
        );

        const company = companyResults.rows[0];

        company.invoices = invoiceResults.rows;
        
        return res.json({company: company});
    } catch(e){
        next(e);
    }
})

router.post("/", async (req, res, next) => {
    try{
        const {code, name, description} = req.body;

        const results = await db.query(
            `INSERT INTO companies (code, name, description) values ($1, $2, $3) RETURNING code, name, description`, [code, name, description]
        );
        return res.status(201).json({company: results.rows[0]});

    }catch(e) {
        next(e);
    }
})

router.put("/:code", async (req, res, next) => {
    try{
        const { name, description } = req.body;
        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`,
            [name, description, req.params.code]
        );
        
        if(results.rows.length === 0) throw new ExpressError('Company not found', 404);


        return res.json({company: results.rows[0]})
    }catch(e) {
        next(e);
    }
})

router.delete("/:code", async (req, res, next) => {
    try{
        const checkCompany = await db.query(
            `SELECT * FROM companies WHERE code=$1`, [req.params.code]
        );
        if(checkCompany.rows.length === 0 ) throw new ExpressError("Company not found", 404);

        const results = await db.query(
            "DELETE FROM companies WHERE code=$1", [req.params.code]);

        return res.send({msg: "DELETED"});
    }catch(e) {
        next(e);
    }
})

module.exports = router;