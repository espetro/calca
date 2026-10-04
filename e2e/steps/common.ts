import { Step } from "gauge-ts";

import { ab, snapshot, snapshotAll, findRef, assertContains } from "../support/ab";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

function evalJs(expr: string): string {
  return ab(`eval "${expr.replace(/"/g, '\\"')}"`).trim();
}

export default class CommonSteps {
  @Step("Open <url>")
  async open(url: string) {
    ab(`open ${url.startsWith("http") ? url : BASE_URL + url}`);
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
  }

  @Step("Click the <label> button")
  async clickButton(label: string) {
    const snap = snapshot();
    ab(`click ${findRef(snap, label)}`);
  }

  @Step("Click <label>")
  async click(label: string) {
    const snap = snapshot();
    ab(`click ${findRef(snap, label)}`);
  }

  @Step("Open the settings dialog")
  async openSettings() {
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
    ab(`upload "input[type=file]" "${path}"`);
  }

  @Step("Press the <key> key")
  async pressKey(key: string) {
    const snap = snapshot();
    ab(`focus ${findRef(snap, "Prompt")}`);
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
    while (Date.now() - start < timeout) {
      const snap = snapshotAll();
      if (snap.includes(`Iframe "${name}`) || snap.includes(`"${name}`)) return;
      if (snap.includes("Failed")) throw new Error(`Node "${name}" failed to render`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`Node "${name}" did not render within ${timeout}ms`);
  }

  @Step("Wait for <n> rendered nodes")
  async waitForNodeCount(n: string) {
    const want = Number(n);
    const start = Date.now();
    const timeout = 300000;
    while (Date.now() - start < timeout) {
      const count = (snapshotAll().match(/Iframe "/g) ?? []).length;
      if (count >= want) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`Expected ${want} rendered nodes within ${timeout}ms`);
  }

  @Step("Select the first canvas node")
  async selectFirstNode() {
    evalJs(`document.querySelector('.react-flow__node').focus()`);
    ab("press Enter");
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
    const box = ab(`get box ".react-flow__node"`).match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
    if (!box) throw new Error("No canvas node to drag");
    const x = Number(box[1]) + Number(box[3]) / 2;
    const y = Number(box[2]) + Number(box[4]) / 2;
    ab(`mouse move ${x} ${y}`);
    ab("mouse down");
    ab(`mouse move ${x + 120} ${y + 80}`);
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

  @Step("Reset the onboarding flag")
  async resetOnboarding() {
    evalJs(
      `const s=JSON.parse(localStorage.getItem('calca-settings')||'{}');s.onboardingCompleted=false;localStorage.setItem('calca-settings',JSON.stringify(s));1`
    );
  }

  @Step("Reload the page")
  async reload() {
    ab(`open ${BASE_URL}`);
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
