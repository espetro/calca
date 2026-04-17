import { describe, it, expect } from "vitest";
import { stripBase64Images } from "./strip-base64";

describe("stripBase64Images", () => {
  it("strips base64 images and provides restore function", () => {
    const input = '<img src="data:image/png;base64,abc123" alt="test" />';
    const { stripped, restore } = stripBase64Images(input);
    
    expect(stripped).toBe('<img src="[IMAGE_PLACEHOLDER_0]" alt="test" />');
    expect(restore(stripped)).toBe(input);
  });

  it("handles multiple base64 images", () => {
    const input = `<div>
      <img src="data:image/png;base64,abc" alt="first" />
      <img src="data:image/jpeg;base64,xyz" alt="second" />
    </div>`;
    const { stripped, restore } = stripBase64Images(input);
    
    expect(stripped).toContain('[IMAGE_PLACEHOLDER_0]');
    expect(stripped).toContain('[IMAGE_PLACEHOLDER_1]');
    expect(restore(stripped)).toBe(input);
  });

  it("handles HTML without base64 images", () => {
    const input = '<div>Hello <img src="/path/to/image.png" alt="test" /></div>';
    const { stripped, restore } = stripBase64Images(input);
    
    expect(stripped).toBe(input);
    expect(restore(stripped)).toBe(input);
  });

  it("handles empty string", () => {
    const { stripped, restore } = stripBase64Images("");
    expect(stripped).toBe("");
    expect(restore(stripped)).toBe("");
  });

  it("preserves non-image attributes", () => {
    const input = '<img src="data:image/png;base64,abc" class="w-10 h-10" id="img1" />';
    const { stripped, restore } = stripBase64Images(input);
    
    expect(stripped).toBe('<img src="[IMAGE_PLACEHOLDER_0]" class="w-10 h-10" id="img1" />');
    expect(restore(stripped)).toBe(input);
  });

  it("handles different image types", () => {
    const input = `<div>
      <img src="data:image/png;base64,png" />
      <img src="data:image/jpeg;base64,jpg" />
      <img src="data:image/gif;base64,gif" />
      <img src="data:image/webp;base64,webp" />
    </div>`;
    const { stripped, restore } = stripBase64Images(input);
    
    expect(stripped).toContain('[IMAGE_PLACEHOLDER_0]');
    expect(stripped).toContain('[IMAGE_PLACEHOLDER_1]');
    expect(stripped).toContain('[IMAGE_PLACEHOLDER_2]');
    expect(stripped).toContain('[IMAGE_PLACEHOLDER_3]');
    expect(restore(stripped)).toBe(input);
  });

  it("restore function is idempotent", () => {
    const input = '<img src="data:image/png;base64,abc" />';
    const { stripped, restore } = stripBase64Images(input);
    
    const first = restore(stripped);
    const second = restore(stripped);
    expect(first).toBe(second);
  });
});
