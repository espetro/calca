import { Step } from "gauge-ts";

import { ab, snapshot, snapshotAll, findRef } from "../support/ab";

export default class PromptBarSteps {
  // The variations control is a stepper (minus / count / plus), not a dropdown.
  // Minus and plus are icon-only buttons with no accessible name — they appear
  // as bare `button [ref=eN]` entries in the interactive snapshot, in DOM
  // order (minus first, plus last).
  @Step("Set the variations count to <value>")
  async setVariationsCount(value: string | number) {
    const target = Number(value);
    for (let i = 0; i < 8; i++) {
      const snap = snapshotAll();
      const label = snap.match(/button "Variations(?: (\d))?"/);
      const current = label?.[1] ? Number(label[1]) : 1;
      if (current === target) return;
      const bare = [...snap.matchAll(/- button \[(?:disabled, )?ref=(\w+)\]/g)];
      const refs = bare.map((m) => m[1]);
      const pick = current < target ? refs[refs.length - 1] : refs[refs.length - 2];
      if (!pick) throw new Error("Variations stepper buttons not found in snapshot");
      ab(`click @${pick}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    throw new Error(`Variations count did not reach ${value}`);
  }
}
