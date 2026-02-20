import { Box } from "./box";
import { Label } from "../rendering/labels";

export class ProcessBox extends Box {
  sequence: number = 0;

  get precedence(): (number | string)[] {
    return [
      -this.rightSide.anchorCount,
      this.leftSide.anchorCount +
        this.topSide.anchorCount +
        this.bottomSide.anchorCount,
    ];
  }

  get width(): number {
    return Math.max(
      Label.textLength(this.name) + 40,
      Math.max(this.topSide.anchorCount, this.bottomSide.anchorCount) * 20 + 20
    );
  }

  get height(): number {
    return Math.max(
      60,
      Math.max(this.leftSide.anchorCount, this.rightSide.anchorCount) * 20 + 20
    );
  }

  after(other: ProcessBox): boolean {
    return this.sequence > other.sequence;
  }

  before(other: ProcessBox): boolean {
    return this.sequence < other.sequence;
  }

  toSvg(): string {
    return [
      `<rect x='${this.x1}' y='${this.y1}' width='${this.width}' height='${this.height}' fill='none' stroke='black' />`,
      `<text text-anchor='middle' x='${this.x1 + this.width / 2}' y='${this.y1 + this.height / 2}'>${this.name}</text>`,
    ].join("\n");
  }
}
