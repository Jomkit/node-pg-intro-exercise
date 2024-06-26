\c biztime

DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS industries_companies CASCADE;

CREATE TABLE industries (
    code text PRIMARY KEY,
    industry text NOT NULL UNIQUE
);

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE industries_companies (
    ind_code text NOT NULL REFERENCES industries ON DELETE CASCADE,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    PRIMARY KEY(ind_code, comp_code)
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

INSERT INTO industries
  VALUES ('tech', 'Technology'), ('rnd', 'Research and Development'), ('srvc', 'Customer Service');

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'), ('msft', 'Microsoft', 'Maker of Windows'), ('ibm', 'IBM', 'Big blue.');

INSERT INTO industries_companies
  VALUES ('rnd', 'apple'), ('tech', 'ibm'), ('rnd', 'msft');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);
