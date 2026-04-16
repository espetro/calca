import { Step } from 'gauge-ts';
import { ab, snapshot, findRef, assertContains } from '../support/ab';

export default class PromptBarSteps {
  @Step("Press the <key> key")
  async pressKey(key: string) {
    const snap = snapshot();
    const ref = findRef(snap, 'Prompt');
    ab(`keypress ${ref} "${key}"`);
  }

  @Step("Click the variations option <value>")
  async clickVariationsOption(value: string) {
    const snap = snapshot();
    const ref = findRef(snap, value);
    ab(`click ${ref}`);
  }
}
