/** Routes for companies */

// Remember, need to import express in order to 
// use Router(), which in turn is needed for making our routes
// outside of app.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

const slugify = require("slugify");

// Remember, all the routes here will be prefixed in app.js 
// with "/companies" thanks to the Router() function and app.use()
// router.get("/", async (req, res, next) => {
//     try{
//         const results = await db.query(`SELECT * FROM companies`);
//         return res.json({companies: results.rows});
//     }catch(e){
//         next(e);
//     }
// })

// FS 4: add names of industries for a company when viewing details
router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`
        SELECT c.*, i.industry 
        FROM companies c
        LEFT JOIN industries_companies AS ic ON c.code = ic.comp_code
        LEFT JOIN industries AS i ON i.code = ic. ind_code
        `);

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

        const compIndResults = await db.query(
            `SELECT i.industry FROM industries_companies ic
            JOIN industries i ON ic.ind_code = i.code
            WHERE ic.comp_code=$1`, [req.params.code]
        );
        
        const invoiceResults = await db.query(
            `SELECT * FROM invoices WHERE comp_code=$1`, [req.params.code]
        );

        const company = companyResults.rows[0];

        company.invoices = invoiceResults.rows;
        company.industries = compIndResults.rows.map(ic => ic.industry);
        
        return res.json({company: company});
    } catch(e){
        next(e);
    }
})

router.post("/", async (req, res, next) => {
    try{
        const {name, description} = req.body;
        let slugCode = slugify(name, {
            replacement: '',
            lower: true,
            remove: /[*+~.(){}'"!?:@]/g,
        })

        const results = await db.query(
            `INSERT INTO companies (code, name, description) values ($1, $2, $3) RETURNING code, name, description`, [slugCode, name, description]
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