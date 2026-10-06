import { Step } from "gauge-ts";

import { ab, appUrl, clearPageDiagnostics, evalJs, snapshotAll } from "../support/ab";

/**
 * Steps for exercising the API layer itself — service worker control, in-page
 * fetches, and failure surfacing. Used by `e2e/specs/sw-runtime.md` (tag `sw`)
 * and the SW stream benchmark; generic enough to run in either API mode.
 */
export default class ApiRuntimeSteps {
  @Step("The page should have no console errors")
  async noConsoleErrors() {
    const pageErrors = ab("errors").trim();
    if (pageErrors && !/no (page )?errors?/i.test(pageErrors)) {
      throw new Error(`Page errors on load:\n${pageErrors.slice(0, 2000)}`);
    }
    const consoleOut = ab("console").trim();
    const errorLines = consoleOut
      .split("\n")
      .map((l) => l.trim())
      .filter(
        (l) =>
          /^(error|ERROR|\[error\])/i.test(l) ||
          /Failed to load resource/.test(l) ||
          /\b(net::ERR|Uncaught)\b/.test(l),
      );
    if (errorLines.length > 0) {
      throw new Error(`Console errors on load:\n${errorLines.slice(0, 20).join("\n")}`);
    }
  }

  @Step("The page should be controlled by a service worker")
  async swControls() {
    const start = Date.now();
    while (Date.now() - start < 15000) {
      const controlled = evalJs(`!!navigator.serviceWorker.controller`);
      if (controlled.includes("true")) {
        const scope = evalJs(`(navigator.serviceWorker.controller||{}).scriptURL||''`);
        if (!scope.endsWith('/sw.js"')) {
          throw new Error(`Unexpected service worker script: ${scope}`);
        }
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const detail = evalJs(
      `(async()=>{const r=await navigator.serviceWorker.getRegistrations();` +
        `return JSON.stringify(r.map(x=>({scope:x.scope,state:x.active&&x.active.state})))})()`,
    );
    throw new Error(`navigator.serviceWorker.controller stayed null — registrations: ${detail}`);
  }

  @Step("In-page fetch <method> <path> should return status <code>")
  async fetchStatus(method: string, path: string, code: string) {
    const verb = method.toUpperCase();
    if (!/^(GET|POST|PUT|DELETE|HEAD|OPTIONS)$/.test(verb)) {
      throw new Error(`Unsupported method "${method}"`);
    }
    const out = evalJs(
      `(async()=>{const r=await fetch('${path}',{method:'${verb}'});` +
        `await r.arrayBuffer().catch(()=>{});return ''+r.status})()`,
    ).replace(/"/g, "");
    if (String(code) !== out) {
      throw new Error(`fetch ${verb} ${path} → status ${out}, expected ${code}`);
    }
  }

  @Step("In-page fetch <path> should return JSON <key> <value>")
  async fetchJson(path: string, key: string, value: string) {
    const out = evalJs(
      `(async()=>{const r=await fetch('${path}');const j=await r.json();` +
        `return String(j[${JSON.stringify(key)}] ?? '')})()`,
    );
    if (out !== `"${value}"` && out !== String(value)) {
      throw new Error(`fetch ${path} JSON.${key} = ${out}, expected "${value}"`);
    }
  }

  @Step("A provider probe to a dead endpoint should surface an error")
  async probeSurfacesError() {
    // Base URL points at a dead local port — the probe must surface the
    // failure (error payload, non-2xx, or zero available models) instead of
    // hanging or reporting success.
    const out = evalJs(
      `(async()=>{try{` +
        `const r=await fetch('/api/probe-models',{method:'POST',` +
          `headers:{'Content-Type':'application/json'},` +
          `body:JSON.stringify({apiKey:'sk-e2e-dead-endpoint',` +
            `providerType:'openai-compatible',baseURL:'http://localhost:1/v1'})});` +
        `const j=await r.json().catch(()=>({}));` +
        `const ok=j&&j.available?Object.keys(j.available).filter(k=>j.available[k]).length:0;` +
        `return JSON.stringify({status:r.status,error:(j&&j.error)||null,available:ok})` +
        `}catch(e){return JSON.stringify({status:0,error:String(e&&e.message||e),available:0})}})()`,
    );
    const result = JSON.parse(JSON.parse(out)) as {
      status: number;
      error: string | null;
      available: number;
    };
    if (result.status === 200 && result.error === null && result.available > 0) {
      throw new Error(`Probe of a dead endpoint reported success — ${out}`);
    }
  }

  @Step("Seed a broken provider")
  async seedBrokenProvider() {
    evalJs(
      `(()=>{const s=JSON.parse(localStorage.getItem('calca-settings')||'{}');` +
        `s.providers=[{id:'e2e-broken',apiType:'openai-compatible',` +
          `baseUrl:'http://localhost:1/v1',apiKey:'sk-e2e-broken-provider',` +
          `models:[{id:'broken-model',displayName:'Broken Model',description:''}],` +
          `lastTested:null}];` +
        `s.model='e2e-broken/broken-model';` +
        `s.onboardingCompleted=true;` +
        `localStorage.setItem('calca-settings',JSON.stringify(s));return 'ok'})()`,
    );
  }

  @Step("Seed provider credentials from the environment")
  async seedProviderFromEnv() {
    // A baked-in env provider (VITE_AI_* at build time) already fills settings —
    // leave it alone; only seed when nothing usable is configured.
    const configured = evalJs(
      `(()=>{const s=JSON.parse(localStorage.getItem('calca-settings')||'{}');` +
        `const p=(s.providers||[]).find(p=>p.apiKey);return !!(p&&s.model)})()`,
    );
    if (configured.includes("true")) return;

    const env = process.env;
    const baseUrl =
      env.E2E_AI_BASE_URL ?? env.VITE_AI_BASE_URL ?? env.CAUCE_AI_BASE_URL ?? env.AI_BASE_URL_PAID;
    const apiKey =
      env.E2E_AI_API_KEY ?? env.VITE_AI_API_KEY ?? env.CAUCE_AI_API_KEY ?? env.AI_API_KEY_PAID;
    const model = env.E2E_AI_MODEL ?? env.VITE_AI_MODEL ?? env.CAUCE_AI_MODEL ?? env.AI_MODEL_ID_PAID;
    if (!baseUrl || !apiKey || !model) {
      throw new Error(
        "No provider credentials available — set E2E_AI_BASE_URL/E2E_AI_API_KEY/E2E_AI_MODEL " +
          "(or VITE_AI_* / CAUCE_AI_*) to run generation specs",
      );
    }
    evalJs(
      `(()=>{const s=JSON.parse(localStorage.getItem('calca-settings')||'{}');` +
        `s.providers=[{id:'e2e-env',apiType:'openai-compatible',` +
          `baseUrl:${JSON.stringify(baseUrl)},apiKey:${JSON.stringify(apiKey)},` +
          `models:[{id:${JSON.stringify(model)},displayName:${JSON.stringify(model)},description:''}],` +
          `lastTested:null}];` +
        `s.model='e2e-env/${model}';` +
        `s.onboardingCompleted=true;` +
        `localStorage.setItem('calca-settings',JSON.stringify(s));return 'ok'})()`,
    );
    // Settings are read on load — reload so the seeded provider is picked up.
    clearPageDiagnostics();
    ab(`open ${appUrl("/")}`);
    const start = Date.now();
    while (Date.now() - start < 15000) {
      if (evalJs(`document.readyState`).includes("complete")) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error("App did not reload after seeding provider credentials");
  }

  @Step("The canvas should show a generation error")
  async generationError() {
    const start = Date.now();
    const timeout = 120000;
    while (Date.now() - start < timeout) {
      const count = Number(
        evalJs(
          `(()=>{return [...document.querySelectorAll('.react-flow__node iframe')]` +
            `.filter(i=>(i.getAttribute('srcdoc')||'').includes('⚠')).length})()`,
        ).replace(/"/g, ""),
      );
      if (count > 0) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`No generation error frame appeared within ${timeout}ms`);
  }

  @Step("Wait up to <seconds> seconds for node <name> to render")
  async waitForNodeSeconds(seconds: string, name: string) {
    const timeout = Number(seconds) * 1000;
    const start = Date.now();
    let snap = "";
    while (Date.now() - start < timeout) {
      snap = snapshotAll();
      if (snap.includes(`Iframe "${name}`)) return;
      if (snap.includes("Failed")) throw new Error(`Node "${name}" failed to render`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`Node "${name}" did not render within ${timeout}ms`);
  }
}
