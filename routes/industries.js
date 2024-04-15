/** FS4: Routes for industries */

const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`
        SELECT i.*, ic.comp_code FROM industries i
        LEFT JOIN industries_companies AS ic ON i.code = ic.ind_code
        `);
        
        return res.json({industries: results.rows});
    } catch(e){
        return next(e);
    }
})

router.get("/:code", async (req, res, next) => {
    try{
        // const companyResults = await db.query(
        //     `SELECT * FROM companies WHERE code=$1`, [req.params.code]
        // );   

        const indResults = await db.query(`
        SELECT * FROM industries
        WHERE code=$1`, [req.params.code]
        );

        if(indResults.rows.length === 0) throw new ExpressError('Industry not found', 404);
        
        const icResults = await db.query(`
        SELECT comp_code FROM industries_companies
        WHERE ind_code=$1`, [req.params.code]);

        const industry = indResults.rows[0];
        industry.comp_codes = icResults.rows.map(c => c.comp_code);
        
        return res.json({industry: industry});

    } catch(e){
        return next(e);
    }
})

// create an industry, passing code and industry name
router.post("/", async (req, res, next) => {
    try{
        const { code, industry } = req.body;
        
        const results = await db.query(`
        INSERT INTO industries (code, industry)
        VALUES ($1, $2)
        RETURNING code, industry
        `, [code, industry])

        return res.status(201).json({industry: results.rows[0]});
        
    }catch(e) {
        return next(e);
    }
});

// associating a company to an industry via codes
router.post("/:code", async (req, res, next) => {
    try{
        const indCode = req.params.code;
        const { comp_code } = req.body;

        const results = await db.query(`
        INSERT INTO industries_companies (ind_code, comp_code) VALUES ($1, $2)
        RETURNING ind_code, comp_code
        `, [ indCode, comp_code]);

        return res.status(201).json({association: results.rows[0]});
        
    }catch(e) {
        return next(e);
    }
})

module.exports = router;