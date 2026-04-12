import { Step } from 'gauge-ts';
import { ab, snapshot, findRef, assertContains } from '../support/ab';

export default class CommonSteps {
  @Step("Open <url>")
  async open(url: string) {
    ab(`open ${url}`);
  }

  @Step("Click the <label> button")
  async clickButton(label: string) {
    const snap = snapshot();
    const ref = findRef(snap, label);
    ab(`click ${ref}`);
  }

  @Step("Click <label>")
  async click(label: string) {
    const snap = snapshot();
    const ref = findRef(snap, label);
    ab(`click ${ref}`);
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

  @Step("Page should contain <text>")
  async pageShouldContain(text: string) {
    const snap = snapshot();
    assertContains(snap, text);
  }

  @Step("Page should not contain <text>")
  async pageShouldNotContain(text: string) {
    const snap = snapshot();
    if (snap.includes(text)) {
      throw new Error(`Expected snapshot to NOT contain "${text}"`);
    }
  }

  @Step("Wait for <label> to appear")
  async waitForLabel(label: string) {
    const start = Date.now();
    const timeout = 5000;
    while (Date.now() - start < timeout) {
      const snap = snapshot();
      try {
        findRef(snap, label);
        return;
      } catch {
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`Label "${label}" did not appear within ${timeout}ms`);
  }
}
