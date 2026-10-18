// Test bad input on all endpoints
// start the server first (npm run dev), then run: npx tsx tests/bad-input.ts
// every request here is wrong on purpose, so we expect 400 on all of them

const API_URL = process.env.API_URL || "http://localhost:3304";

type TestCase = {
  name: string;
  method: string;
  path: string;
  body?: string;
};

const goodBody = JSON.stringify({
  date: "2026-09-20",
  recipient: "ICA",
  amount: -100,
});

const tests: TestCase[] = [
  // GET /transactions/:id
  { name: "id is text", method: "GET", path: "/transactions/abc" },
  { name: "id is decimal", method: "GET", path: "/transactions/1.5" },
  { name: "id is 0", method: "GET", path: "/transactions/0" },
  { name: "id is negative", method: "GET", path: "/transactions/-1" },
  { name: "id is too big", method: "GET", path: "/transactions/99999999999" },

  // POST /transactions
  { name: "empty body", method: "POST", path: "/transactions", body: "{}" },
  {
    name: "date does not exist",
    method: "POST",
    path: "/transactions",
    body: JSON.stringify({ date: "2026-02-30", recipient: "ICA", amount: -100 }),
  },
  {
    name: "date wrong format",
    method: "POST",
    path: "/transactions",
    body: JSON.stringify({ date: "20/09/2026", recipient: "ICA", amount: -100 }),
  },
  {
    name: "recipient only spaces",
    method: "POST",
    path: "/transactions",
    body: JSON.stringify({ date: "2026-09-20", recipient: "   ", amount: -100 }),
  },
  {
    name: "recipient is a number",
    method: "POST",
    path: "/transactions",
    body: JSON.stringify({ date: "2026-09-20", recipient: 123, amount: -100 }),
  },
  {
    name: "amount is text",
    method: "POST",
    path: "/transactions",
    body: JSON.stringify({ date: "2026-09-20", recipient: "ICA", amount: "100" }),
  },
  {
    name: "amount is 0",
    method: "POST",
    path: "/transactions",
    body: JSON.stringify({ date: "2026-09-20", recipient: "ICA", amount: 0 }),
  },
  { name: "body is a list", method: "POST", path: "/transactions", body: "[]" },
  {
    name: "broken json",
    method: "POST",
    path: "/transactions",
    body: '{"date": "2026-09-20", ',
  },

  // PUT /transactions/:id
  { name: "put with bad id", method: "PUT", path: "/transactions/abc", body: goodBody },
  {
    name: "put with bad body",
    method: "PUT",
    path: "/transactions/1",
    body: JSON.stringify({ amount: "lots" }),
  },
  { name: "put with broken json", method: "PUT", path: "/transactions/1", body: "{{" },

  // DELETE /transactions/:id
  { name: "delete with text id", method: "DELETE", path: "/transactions/abc" },
  { name: "delete with id 0", method: "DELETE", path: "/transactions/0" },

  // GET /filter
  { name: "filter without dates", method: "GET", path: "/filter" },
  { name: "filter with only from", method: "GET", path: "/filter?from=2026-09-01" },
  {
    name: "filter with bad date",
    method: "GET",
    path: "/filter?from=2026-09-01&to=2026-09-99",
  },
  {
    name: "filter from after to",
    method: "GET",
    path: "/filter?from=2026-09-10&to=2026-09-01",
  },
  {
    name: "filter with two from",
    method: "GET",
    path: "/filter?from=2026-09-01&from=2026-09-02&to=2026-09-10",
  },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  const options: RequestInit = {
    method: test.method,
    headers: { "Content-Type": "application/json" },
  };
  if (test.body !== undefined) {
    options.body = test.body;
  }

  try {
    const response = await fetch(API_URL + test.path, options);
    const text = await response.text();

    let message = "";
    try {
      message = JSON.parse(text).message;
    } catch {
      message = "(answer was not json)";
    }

    if (response.status === 400 && message !== "(answer was not json)") {
      passed++;
      console.log(`PASS  ${test.name} -> 400 ${message}`);
    } else {
      failed++;
      console.log(`FAIL  ${test.name} -> ${response.status} ${message}`);
    }
  } catch {
    failed++;
    console.log(`FAIL  ${test.name} -> could not connect to ${API_URL}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
