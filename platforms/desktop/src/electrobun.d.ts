// Ambient declaration for electrobun to prevent TypeScript from type-checking
// electrobun's own .ts source files, which ship without .d.ts declarations
// and contain internal type errors unrelated to this project.
declare module "electrobun/bun" {
  export interface Point {
    x: number;
    y: number;
  }

  interface Rect extends Point {
    width: number;
    height: number;
  }

  export class BrowserWindow {
    constructor(options: { title?: string; frame?: Rect; url?: string });
    on(
      name: "resize",
      handler: (event: {
        data: { id: number; x: number; y: number; width: number; height: number };
      }) => void,
    ): void;
    setSize(width: number, height: number): void;
  }
  export class ApplicationMenu {
    static setApplicationMenu(menu: unknown[]): void;
  }
}
