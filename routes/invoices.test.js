process.env.NODE_ENV = 'test';

const request = require("supertest");

const app = require("../app");
const db = require("../db");
const Test = require("supertest/lib/test");

let testComp;
let testInv;

beforeEach(async () => {
    let compInvPromises = await Promise.all([
        db.query("INSERT INTO companies (code, name, description) VALUES ('tst', 'Test', 'This is a test') RETURNING *"),
        db.query("INSERT INTO invoices (comp_code, amt) VALUES ('tst', 400) RETURNING *"),
        db.query("INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('tst', 800, true, '2022-04-05') RETURNING *")
    ])
    testComp = compInvPromises[0].rows[0];
    testInv = compInvPromises[1].rows[0];
    testInv2 = compInvPromises[2].rows[0];
})

afterEach(async () => {
    // Delete any data created by test
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
})

afterAll(async ()=>{
    await db.end();
})

describe("GET /invoices", function() {
    test("Get all invoices", async ()=>{
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: [
            {
                id: expect.any(Number),
                comp_code: testInv.comp_code,
                amt: testInv.amt,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            },
            {
                id: expect.any(Number),
                comp_code: testInv2.comp_code,
                amt: testInv2.amt,
                paid: true,
                add_date: expect.any(String),
                paid_date: expect.any(String)
            }
        ]
        })
    })
})

describe("GET /invoices/:id", ()=>{
    test("Get a single invoice", async ()=>{
        const response = await request(app).get(`/invoices/${testInv.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: testInv.comp_code,
                amt: testInv.amt,
                paid: false,
                add_date: expect.any(String),
                paid_date: null,
                company_name: testComp.name,
                description: testComp.description
            }
        });
    })

    test("Responds with 404 when invoice not found", async ()=> {
        const response = await request(app).get(`/invoices/99`);
        expect(response.statusCode).toEqual(404);
    })
})

describe("POST /invoices", ()=>{
    test("Creates new invoice", async ()=> {
        const results = await request(app).post(`/invoices`)
        .send({
            comp_code: 'tst',
            amt: 999
        });

        expect(results.statusCode).toEqual(201);
        expect(results.body).toEqual({
            invoice: {
                comp_code: 'tst',
                amt: 999,
                id: expect.any(Number),
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });
});

describe("PUT /invoices/:id", ()=>{
    test("Update the amount of an invoice, the invoice if unpaid stays unpaid", async ()=>{
        const results = await request(app).put(`/invoices/${testInv.id}`)
        .send({
            amt: 666,
            paid: false
        });
        expect(results.statusCode).toEqual(200);
        expect(results.body).toEqual({
            invoice: {
                amt: 666,
                id: testInv.id,
                comp_code: 'tst',
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });

    test("Update an invoice to paid=true", async ()=>{
        const results = await request(app).put(`/invoices/${testInv.id}`)
        .send({
            amt: 400,
            paid: true
        });
        expect(results.statusCode).toEqual(200);
        expect(results.body).toEqual({
            invoice: {
                amt: 400,
                id: testInv.id,
                comp_code: 'tst',
                paid: true,
                add_date: expect.any(String),
                paid_date: expect.any(String)
            }
        })
    })

    test("Updates an invoice, if paid already, then paid_date stays the same", async ()=>{
        const results = await request(app).put(`/invoices/${testInv2.id}`)
        .send({
            amt: 400,
            paid: true
        });
        expect(results.statusCode).toEqual(200);
        expect(results.body).toEqual({
            invoice: {
                amt: 400,
                id: testInv2.id,
                comp_code: 'tst',
                paid: true,
                add_date: expect.any(String),
                paid_date: expect.any(String)
            }
        })
    })

    test("Responds with 404 if invoice not found", async ()=>{
        const results = await request(app).put(`/invoices/999`)
        .send({
            amt: 6666
        });
        expect(results.statusCode).toEqual(404);
    })
})

describe("DELETE /invoices/:id", ()=>{
    test("Delete an invoice", async ()=>{
        const results = await request(app).delete(`/invoices/${testInv.id}`);
        expect(results.statusCode).toEqual(200);
        expect(results.body).toEqual({msg: "DELETED"});
    })

    test("Responds with 404 when invoice not found", async ()=>{
        const results = await request(app).delete(`/invoices/999`);
        expect(results.statusCode).toEqual(404);
    })
})