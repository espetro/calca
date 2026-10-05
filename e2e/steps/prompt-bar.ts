import { Step } from "gauge-ts";

import { ab, snapshot, snapshotAll, findRef } from "../support/ab";

export default class PromptBarSteps {
  // The variations control is a stepper (minus / count / plus), not a dropdown.
  // The stepper buttons are named "Decrease variations" / "Increase variations".
  @Step("Set the variations count to <value>")
  async setVariationsCount(value: string | number) {
    const target = Number(value);
    for (let i = 0; i < 8; i++) {
      const snap = snapshotAll();
      const label = snap.match(/button "Variations(?: (\d))?"/);
      const current = label?.[1] ? Number(label[1]) : 1;
      if (current === target) return;
      const pick = findRef(
        snap,
        current < target ? "Increase variations" : "Decrease variations",
      );
      ab(`click ${pick}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    throw new Error(`Variations count did not reach ${value}`);
  }
}
