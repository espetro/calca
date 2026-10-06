import { existsSync, readFileSync } from "fs";
import { basename, resolve } from "path";

import { Step, BeforeSpec } from "gauge-ts";

import {
  ab,
  appUrl,
  clearPageDiagnostics,
  evalJs,
  snapshot,
  snapshotAll,
  findRef,
  assertContains,
} from "../support/ab";

export default class CommonSteps {
  @BeforeSpec()
  async coldStart() {
    clearPageDiagnostics();
    ab(`open ${appUrl("/")}`);
    // Canvas images live in IndexedDB (calca-canvas-images) — localStorage.clear
    // alone leaves stale nodes findable by waitForNode across runs.
    evalJs(
      `(async()=>{const ds=await(indexedDB.databases?indexedDB.databases():[]);`
      + `await Promise.all(ds.map(d=>new Promise(r=>{`
      + `const q=indexedDB.deleteDatabase(d.name);`
      + `q.onsuccess=q.onerror=q.onblocked=()=>r(0)})))})()`);
    evalJs(`localStorage.clear()`);
    clearPageDiagnostics();
    ab(`open ${appUrl("/")}`);
  }

  @Step("Open <url>")
  async open(url: string) {
    clearPageDiagnostics();
    ab(`open ${appUrl(url)}`);
    const start = Date.now();
    while (Date.now() - start < 15000) {
      if (!snapshot().includes("no interactive elements")) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    await this.dismissOnboarding();
  }

  @Step("Dismiss the onboarding dialog")
  async dismissOnboarding() {
    const snap = snapshot();
    if (snap.includes("Welcome to Calca")) {
      ab(`click ${findRef(snap, "Skip for now")}`);
    }
    this.dismissOverlay();
  }

  private dismissOverlay() {
    const out = evalJs(
      `(()=>{const d=document.querySelector('[data-tour=summary-dialog]');` +
        `if(!d)return 'none';const b=d.querySelector('.absolute.inset-0');` +
        `if(b){b.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'closed'}return 'open'})()`
    );
    return out;
  }

  @Step("Click the <label> button")
  async clickButton(label: string) {
    let lastErr: unknown;
    let lastSnap = "";
    for (let i = 0; i < 4; i++) {
      lastSnap = snapshot();
      try {
        ab(`click ${findRef(lastSnap, label)}`);
        return;
      } catch (err) {
        lastErr = err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error(`${lastErr}\n--- snapshot at failure ---\n${lastSnap.slice(0, 3000)}`);
  }

  @Step("Click <label>")
  async click(label: string) {
    const snap = snapshot();
    ab(`click ${findRef(snap, label)}`);
  }

  @Step("Open the settings dialog")
  async openSettings() {
    ab("frame main");
    ab(`click "[data-tour=toolbar-settings]"`);
  }

  @Step("Fill <value> in the <label> field")
  async fillField(value: string, label: string) {
    const snap = snapshot();
    const ref = findRef(snap, label);
    ab(`fill ${ref} "${value}"`);
  }

  @Step("Select <value> in the <label> dropdown")
  async selectDropdown(value: string, label: string) {
    const snap = snapshot();
    const ref = findRef(snap, label);
    ab(`select ${ref} "${value}"`);
  }

  @Step("Upload <path> to the media picker")
  async uploadMedia(path: string) {
    ab("frame main");
    const filePath =
      [resolve(path), resolve("..", path)].find((c) => existsSync(c)) ?? resolve(path);
    ab(`upload "input[type=file]" "${filePath}"`);
  }

  @Step("Import <path> as a design file")
  async importDesign(path: string) {
    // agent-browser's upload is unreliable for this input: the change it
    // dispatches does not bubble to React's root delegation, and the File's
    // backing stream sometimes never resolves. Constructing the File in-page
    // via DataTransfer produces a real bubbling change — the same signal a
    // file picker produces — and is fully deterministic.
    ab("frame main");
    // Steps run with cwd=e2e, but spec paths are repo-root relative — try both.
    const filePath =
      [resolve(path), resolve("..", path)].find((c) => existsSync(c)) ?? resolve(path);
    const b64 = readFileSync(filePath).toString("base64");
    const name = basename(filePath);
    const placed = evalJs(
      `(()=>{const bin=atob('${b64}');` +
        `const bytes=Uint8Array.from(bin,(c)=>c.charCodeAt(0));` +
        `const f=new File([bytes],'${name}',{type:'application/json'});` +
        `const dt=new DataTransfer();dt.items.add(f);` +
        `const i=document.querySelector('[data-tour=import-file]');` +
        `i.files=dt.files;` +
        `const n=i.files.length;` +
        `i.dispatchEvent(new Event('change',{bubbles:true}));` +
        `return 'files:'+n})()`,
    );
    if (!placed.includes("files:1")) {
      throw new Error(`Design file was not attached to the import input — ${placed}`);
    }
    const start = Date.now();
    let diag = "";
    while (Date.now() - start < 15000) {
      diag = evalJs(
        `JSON.stringify({hasSession:!!localStorage.getItem('calca-canvas-session'),` +
          `toast:(document.querySelector('[data-sonner-toast]')||{textContent:''}).textContent})`,
      );
      try {
        const state = JSON.parse(JSON.parse(diag));
        if (state.hasSession) return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`Design import did not reach the canvas store — ${diag}`);
  }

  @Step("Press the <key> key")
  async pressKey(key: string) {
    const snap = snapshot();
    ab(`focus ${findRef(snap, "Prompt")}`);
    ab(`press ${key}`);
  }

  @Step("Press <key>")
  async pressKeyGlobal(key: string) {
    ab(`press ${key}`);
  }

  @Step("Page should contain <text>")
  async pageShouldContain(text: string) {
    const snap = snapshotAll();
    assertContains(snap, text);
  }

  @Step("Page should not contain <text>")
  async pageShouldNotContain(text: string) {
    const snap = snapshotAll();
    if (snap.includes(text)) {
      throw new Error(`Expected snapshot to NOT contain "${text}"`);
    }
  }

  @Step("Wait for <label> to appear")
  async waitForLabel(label: string) {
    const start = Date.now();
    const timeout = 30000;
    while (Date.now() - start < timeout) {
      if (snapshotAll().includes(label)) return;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`Label "${label}" did not appear within ${timeout}ms`);
  }

  @Step("Wait for node <name> to render")
  async waitForNode(name: string) {
    const start = Date.now();
    const timeout = 300000;
    let snap = "";
    while (Date.now() - start < timeout) {
      snap = snapshotAll();
      if (snap.includes(`Iframe "${name}`)) return;
      if (snap.includes("Failed")) throw new Error(`Node "${name}" failed to render`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    let pageErrors = "";
    try {
      pageErrors = ab("errors").slice(0, 2000);
    } catch {
      pageErrors = "(could not read page errors)";
    }
    throw new Error(
      `Node "${name}" did not render within ${timeout}ms\n--- page errors ---\n${pageErrors}\n--- snapshot tail ---\n${snap.slice(-2000)}`,
    );
  }

  @Step("Wait for <n> rendered nodes")
  async waitForNodeCount(n: string) {
    const want = Number(n);
    const start = Date.now();
    const timeout = 600000;
    while (Date.now() - start < timeout) {
      const count = (snapshotAll().match(/Iframe "/g) ?? []).length;
      if (count >= want) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`Expected ${want} rendered nodes within ${timeout}ms`);
  }

  @Step("Select the first canvas node")
  async selectFirstNode() {
    ab("frame main");
    ab(`click ".react-flow__node"`);
  }

  @Step("The first canvas node should be in the viewport")
  async firstNodeInViewport() {
    const res = evalJs(
      `(()=>{const n=document.querySelector('.react-flow__node');` +
        `if(!n)return 'missing';` +
        `const r=n.getBoundingClientRect();` +
        `const ok=r.left>=0&&r.top>=0&&r.right<=window.innerWidth&&r.bottom<=window.innerHeight;` +
        `return ok?'in-view':JSON.stringify({l:Math.round(r.left),t:Math.round(r.top),` +
          `r:Math.round(r.right),b:Math.round(r.bottom),w:window.innerWidth,h:window.innerHeight})})()`,
    );
    if (res !== '"in-view"') {
      throw new Error(`First canvas node is not fully in the viewport — ${res}`);
    }
  }

  @Step("Move the caret to the <pos> of the prompt field")
  async moveCaret(pos: string) {
    const p = pos === "start" ? "0,0" : "t.value.length,t.value.length";
    evalJs(`(()=>{const t=document.querySelector('textarea');if(!t)throw new Error('no textarea');t.setSelectionRange(${p});return 'ok'})()`);
  }

  @Step("The prompt field should contain <text>")
  async promptContains(text: string) {
    const value = evalJs(`(document.querySelector('textarea')||{value:''}).value`);
    if (!value.includes(text)) {
      throw new Error(`Prompt field expected "${text}", got ${value}`);
    }
  }

  @Step("The prompt field should be empty")
  async promptEmpty() {
    const value = evalJs(`(document.querySelector('textarea')||{value:''}).value`);
    if (value && value !== '""' && value !== "''") {
      throw new Error(`Prompt field not empty: ${value}`);
    }
  }

  @Step("Hover the <tour> control")
  async hoverControl(tour: string) {
    evalJs(
      `(()=>{const el=document.querySelector('[data-tour=${tour}]');if(!el)throw new Error('no ${tour}');` +
        `el.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));` +
        `el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse'}));` +
        `return el.getAttribute('aria-expanded')})()`
    );
  }

  @Step("Seed an image attachment named <name>")
  async seedImage(name: string) {
    evalJs(
      `(()=>{const s=JSON.parse(localStorage.getItem('calca-settings')||'{}');` +
        `s.selectedImages=[{id:'seed-1',name:'${name}',src:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='}];` +
        `localStorage.setItem('calca-settings',JSON.stringify(s));return 'ok'})()`
    );
  }

  @Step("Seed prompt history with <recent> and <older>")
  async seedHistory(recent: string, older: string) {
    evalJs(`localStorage.setItem('calca-prompt-history', JSON.stringify(['${recent}','${older}']))`);
  }

  @Step("Page should show the prompt bar")
  async promptBarVisible() {
    const out = evalJs(`!!document.querySelector('textarea')`);
    if (!out.includes("true")) throw new Error("prompt bar textarea not found");
  }

  @Step("Quick mode should be <state>")
  async quickModeState(state: string) {
    const raw = evalJs(
      `JSON.parse(localStorage.getItem('calca-settings')||'{}').quickMode`
    );
    const got = raw.replace(/["']/g, "");
    const enabled = got === "true";
    if (enabled !== (state === "enabled")) {
      throw new Error(`Quick mode expected ${state}, localStorage.quickMode=${got}`);
    }
  }

  private dragStart: string | null = null;

  @Step("Drag the first canvas node")
  async dragFirstNode() {
    this.dragStart = evalJs(
      `document.querySelector('.react-flow__node').style.transform || document.querySelector('.react-flow__node').getAttribute('data-id')`
    );
    ab("frame main");
    const out = ab(`get box ".react-flow__node"`);
    const num = (key: string) => Number(out.match(new RegExp(`${key}:\\s*(\\d+)`))?.[1] ?? NaN);
    const bx = num("x");
    const by = num("y");
    const bw = num("width");
    const bh = num("height");
    if ([bx, by, bw, bh].some(Number.isNaN)) throw new Error("No canvas node to drag");
    const x = Math.round(bx + bw / 2);
    const y = Math.round(by + bh / 2);
    ab(`mouse move ${x} ${y} --steps 3`);
    ab("mouse down");
    ab(`mouse move ${x + 120} ${y + 80} --steps 15 --duration 600`);
    ab("mouse up");
  }

  @Step("The first canvas node should have moved")
  async nodeMoved() {
    const now = evalJs(`document.querySelector('.react-flow__node').style.transform`);
    if (this.dragStart && now === this.dragStart) {
      throw new Error(`Node did not move (transform still ${now})`);
    }
  }

  @Step("Wait for page to load completely")
  async waitForLoad() {
    const start = Date.now();
    while (Date.now() - start < 15000) {
      if (evalJs("document.readyState").includes("complete")) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error("document.readyState did not reach 'complete' in 15s");
  }

  @Step("Wait up to <seconds> seconds")
  async waitSeconds(seconds: string) {
    await new Promise((resolve) => setTimeout(resolve, Number(seconds) * 1000));
  }

  @Step("Clear the attachments")
  async clearAttachments() {
    evalJs(
      `(()=>{const s=JSON.parse(localStorage.getItem('calca-settings')||'{}');delete s.selectedImages;localStorage.setItem('calca-settings',JSON.stringify(s));return 'ok'})()`,
    );
    clearPageDiagnostics();
    ab(`open ${appUrl("/")}`);
    const start = Date.now();
    while (Date.now() - start < 15000) {
      if (snapshot().includes("Prompt")) return;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("App did not reload after clearing attachments");
  }

  @Step("Switch to the Select tool")
  async selectTool() {
    evalJs(`document.activeElement && document.activeElement.blur()`);
    evalJs(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'v',bubbles:true}))`);
  }

  @Step("Reset the onboarding flag")
  async resetOnboarding() {
    const out = evalJs(
      `(()=>{const s=JSON.parse(localStorage.getItem('calca-settings')||'{}');s.onboardingCompleted=false;localStorage.setItem('calca-settings',JSON.stringify(s));return JSON.parse(localStorage.getItem('calca-settings')).onboardingCompleted})()`
    );
    if (out.includes("true")) throw new Error("onboarding flag reset failed");
  }

  @Step("Reload the page")
  async reload() {
    clearPageDiagnostics();
    ab(`open ${appUrl("/")}`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  @Step("Scroll to the <label> section")
  async scrollTo(label: string) {
    const snap = snapshot();
    ab(`scrollintoview ${findRef(snap, label)}`);
  }

  @Step("Click the <label> icon")
  async clickIcon(label: string) {
    const snap = snapshot();
    ab(`click ${findRef(snap, label)}`);
  }

  @Step("Click outside the modal")
  async clickOutside() {
    ab("mouse move 10 10");
    ab("mouse down");
    ab("mouse up");
  }
}
