// Isolated contract tests: no requests are sent to an email provider.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configSource = fs.readFileSync(path.join(__dirname, "../app/config.ts"), "utf8");
const routeSource = fs.readFileSync(path.join(__dirname, "../app/api/lead/route.ts"), "utf8");
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const config = { exports: {} };
vm.runInNewContext(compile(configSource), { exports: config.exports });

function createRoute(env = {}, send = async () => new Response('{"id":"test-only"}', { status: 200 })) {
  const route = { exports: {} };
  vm.runInNewContext(compile(routeSource), {
    exports: route.exports, process: { env }, Response, Request, URL, AbortSignal,
    fetch: send, require: () => config.exports,
  });
  return route.exports.POST;
}

const valid = { name: "Test & example", businessName: "<Test business>", phone: "+447700900000", sourcePage: "Test only" };
const request = (body, origin = "https://aidigitalprime.co.uk") => new Request("https://aidigitalprime.co.uk/api/lead", {
  method: "POST", headers: { "Content-Type": "application/json", host: "aidigitalprime.co.uk", origin }, body: JSON.stringify(body),
});
const env = { RESEND_API_KEY: "test-placeholder", LEAD_FROM_EMAIL: "Test <website@forms.example.com>" };

(async () => {
  assert.equal((await createRoute()(request(valid))).status, 503, "Missing configuration must not report success");
  assert.equal((await createRoute()(request(null))).status, 400);
  assert.equal((await createRoute()(request([]))).status, 400);
  assert.equal((await createRoute()(request({ ...valid, phone: "not-a-number" }))).status, 400);
  assert.equal((await createRoute()(request(valid, "https://unrelated.example"))).status, 403);
  assert.equal((await createRoute({}, () => { throw Error("Honeypot must not send"); })(request({ ...valid, companyFax: "spam" }))).status, 200);
  let sent;
  const success = await createRoute(env, async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    sent = JSON.parse(options.body);
    return new Response('{"id":"test-only"}', { status: 200 });
  })(request(valid));
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { ok: true });
  assert.deepEqual(sent.to, ["andrei@aidigitalprime.co.uk"]);
  assert.ok(sent.html.includes("&lt;Test business&gt;"));
  assert.ok(sent.html.includes("Test &amp; example"));
  assert.ok(sent.text.includes("Phone: +447700900000"));
  assert.ok(sent.text.includes("Submitted (UTC):"));
  assert.equal((await createRoute(env, async () => new Response("rejected", { status: 403 }))(request(valid))).status, 502);
  assert.equal((await createRoute(env, async () => { throw Error("Connection failed"); })(request(valid))).status, 502);
  const limited = createRoute();
  for (let i = 0; i < 4; i++) await limited(request(valid));
  assert.equal((await limited(request(valid))).status, 429);
  console.log("PASS: recipient, escaping, timestamps, validation, same-origin, honeypot, missing config, provider errors and rate limiting. No real email sent.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
