/**
 * Envelope crypto — SCAFFOLD ONLY.
 *
 * Phase 4 (issue #42) adds the user-run, E2E-encrypted Yjs relay: 256-bit
 * fragment secrets, no password-derived keys, agents as signed peers.
 * These signatures pin the API surface; implementation lands with the
 * relay work. Runtime-neutral: WebCrypto (`crypto.subtle`) only.
 */

/** An encrypted message envelope exchanged over the relay. Shape TBD in Phase 4. */
export interface Envelope {
  readonly version: number;
  readonly nonce: Uint8Array;
  readonly ciphertext: Uint8Array;
}

/** A 256-bit room secret, carried in the board URL fragment — never a password. */
export interface RoomKey {
  readonly bytes: Uint8Array;
}

/** Generate a fresh 256-bit room key. Not implemented until Phase 4. */
export const generateRoomKey = (): RoomKey => {
  throw new Error("generateRoomKey is not implemented — envelope crypto lands in Phase 4 (#42)");
};

/** Seal a payload into an envelope under `key`. Not implemented until Phase 4. */
export const sealEnvelope = (_key: RoomKey, _payload: Uint8Array): Envelope => {
  throw new Error("sealEnvelope is not implemented — envelope crypto lands in Phase 4 (#42)");
};

/** Open an envelope under `key`. Not implemented until Phase 4. */
export const openEnvelope = (_key: RoomKey, _envelope: Envelope): Uint8Array => {
  throw new Error("openEnvelope is not implemented — envelope crypto lands in Phase 4 (#42)");
};
