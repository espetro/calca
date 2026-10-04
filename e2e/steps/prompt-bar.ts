import { Step } from "gauge-ts";

import { ab, snapshot, findRef } from "../support/ab";

export default class PromptBarSteps {
  @Step("Click the variations option <value>")
  async clickVariationsOption(value: string | number) {
    const snap = snapshot();
    ab(`click ${findRef(snap, String(value))}`);
  }
}
