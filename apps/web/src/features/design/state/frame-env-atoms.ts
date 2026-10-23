import { atom } from "jotai";

import { DEFAULT_OUTPUT_FORMAT, getFrameEnv } from "#/features/design/lib/frame-env";
import { frameEnvSettingsAtom } from "#/features/settings/state/settings-atoms";

/**
 * Frame environment derived from user settings — re-resolves whenever the
 * frame-resource settings (custom CSS, frame attrs, animations) change.
 * Unknown formats resolve to `undefined`, falling back to the legacy
 * hardcoded frame template.
 */
export const frameEnvAtom = atom((get) =>
  getFrameEnv(DEFAULT_OUTPUT_FORMAT, get(frameEnvSettingsAtom)),
);
