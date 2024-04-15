process.env.NODE_ENV = 'test';

const request = require("supertest");

const app = require('../app');
const db = require("../db");

let testCompany;

beforeEach(async function() {
    let companyRes = await Promise.all(
        [
            db.query(`
                INSERT INTO companies (code, name, description) 
                VALUES ('tst', 'Test', 'Test company description')
                RETURNING *
            `),
            db.query(`
            INSERT INTO industries (code, industry) VALUES ('rnd', 'Research and Development')
            `),
            db.query(`
            INSERT INTO industries_companies (ind_code, comp_code) VALUES ('rnd', 'tst')
            `)
        ]
    ) 
    // let compRes = await db.query(`
    // INSERT INTO companies (code, name, description) 
    // VALUES ('tst', 'Test', 'Test company description')
    // RETURNING *
    // `);
    // let indRes = await db.query(`
    // INSERT INTO industries (code, industry) VALUES ('rnd', 'Research and Development')
    // `)
    // let icResults = await db.query(`
    // INSERT INTO industries_companies (ind_code, comp_code) VALUES ('rnd', 'tst')
    // `)

    // testCompany = compRes.rows[0];
    testCompany = companyRes[0].rows[0];
})

afterEach(async function() {
    // delete any data created by test
    await Promise.all([
        db.query("DELETE FROM companies"), 
        db.query("DELETE FROM industries"),
        db.query("DELETE FROM industries_companies")
    ]);
});

afterAll(async () => {
    // close db connection
    await db.end();
})

describe("GET /companies", function() {
    test("Gets a list of 1 company", async function() {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [
                {
                    code: testCompany.code,
                    description: testCompany.description,
                    industry: "Research and Development",
                    name: testCompany.name
                }
            ]
        });
    });
});

describe("GET /companies/:code", function() {
    test("Gets a single company", async function() {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                name: 'Test', 
                description: 'Test company description',
                code: 'tst',
                industries: ['Research and Development'],
                invoices: expect.any(Array)
            }
        });
    });
    test("Responds with 404 if company not found", async function() {
        const response = await request(app).get('/companies/fake');
        expect(response.statusCode).toEqual(404);
    });
});

describe('POST /companies', function() {
    test("Creates a new company", async function() {
        const response = await request(app).post('/companies')
        .send({
            // code: "tsta",
            name: "Test Again", 
            description: "This is another test company"
        });

        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: 'testagain',
                name: 'Test Again', 
                description: 'This is another test company'
            }
        });
    });

    test("Creates new company and slugifies name to create a company code without spaces, or weird punctuation, and all lowercase", async function() {
        const response = await request(app).post('/companies')
        .send({
            // code: "tsta",
            name: "W!ng D?ngl({ Lmtd.", 
            description: "This is another test company"
        });

        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: 'wngdngllmtd',
                name: 'W!ng D?ngl({ Lmtd.', 
                description: 'This is another test company'
            }
        });
    });
});

describe('PUT /companies/:code', function() {
    test("Update information for a company", async function() {
        const response = await request(app)
        .put(`/companies/${testCompany.code}`)
        .send({
            name: "Test 2",
            description: "I updated this test company"
        });

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                name: 'Test 2', 
                description: 'I updated this test company', 
                code: 'tst'
            }
        })
    });

    test("Responds with 404 if company not found", async function() {
        const response = await request(app)
        .put(`/companies/dne`)
        .send({
            name: "Not Exist",
            description: "Does not exist"
        });

        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", function() {
    test("Delete a company", async function() {
        const response = await request(app).delete(`/companies/${testCompany.code}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({msg: "DELETED"});
    })
})

