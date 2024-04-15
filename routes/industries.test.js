process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require("../app");
const db = require("../db");

let testIndustry;

beforeEach(async () => {
    let results = await Promise.all([
        db.query(`INSERT INTO industries (code, industry) VALUES ('indy', 'Industry'), ('indy2', 'Second Industry')`),
        db.query(`INSERT INTO companies (code, name, description) VALUES ('tst', 'test', 'test company'), ('tst2', 'test 2', 'Second Test Company')`),
        db.query(`INSERT INTO industries_companies (ind_code, comp_code) VALUES ('indy', 'tst'), ('indy', 'tst2')`)
    ]);

    testIndustry = results[0].rows[0];
})

afterEach(async ()=>{
    await Promise.all([
        db.query("DELETE FROM companies"),
        db.query("DELETE FROM industries")
    ]);
});

afterAll(async () => {
    // close db connection
    await db.end();
})

describe("GET /industries", ()=>{
    test("Gets all (two) industries", async ()=>{
        const response = await request(app).get("/industries");
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            industries: [
                {code: 'indy', industry: 'Industry', comp_code: "tst"},
                {code: 'indy', industry: 'Industry', comp_code: "tst2"},
                {code: 'indy2', industry: 'Second Industry', comp_code: null},
            ]
        })
    })
})

describe("GET /industries/:code", ()=>{
    test("Gets a single industry with associated company names", async ()=>{
        const response = await request(app).get("/industries/indy");
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            industry: {code: 'indy', industry: 'Industry', comp_codes: ['tst', 'tst2']}
        })
    })

    test("Responds with 404 when industry not found", async ()=>{
        const response = await request(app).get("/industries/noindustry");
        expect(response.statusCode).toEqual(404);
    })
})

describe("POST /industries", ()=>{
    test("Create an industry", async ()=>{
        const response = await request(app).post("/industries").send({code:"ind3", industry:"Third Industry"});
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            industry: {
                code: "ind3", 
                industry: "Third Industry"
            }
        })
    })
})

describe("POST /industries/:code", ()=>{
    test("Create a new industry to company association", async ()=>{
        const response = await request(app).post("/industries/indy2").send({comp_code:"tst"});
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            association: {
                ind_code: "indy2", 
                comp_code: "tst"
            }
        })
    })
})