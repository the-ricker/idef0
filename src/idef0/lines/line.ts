import { Point } from "../util/point";
import { LeftAlignedLabel, Label } from "../rendering/labels";
import type { Bounds } from "../util/bounds";
import type { BoundsExtension } from "../util/bounds";
import type { Box } from "../layout/box";
import type { Side } from "../layout/sides";
import type { Anchor } from "../layout/anchor";

export abstract class Line {
  readonly source: Box;
  readonly target: Box;
  readonly name: string;
  sourceAnchor!: Anchor;
  targetAnchor!: Anchor;
  private clearanceMap: Map<Side, number> = new Map();

  constructor(source: Box, target: Box, name: string) {
    this.source = source;
    this.target = target;
    this.name = name;
  }

  isBackward(): boolean {
    return this.constructor.name.startsWith("Backward");
  }

  get label(): Label {
    return new LeftAlignedLabel(
      this.name,
      new Point(this.sourceAnchor.x + 5, this.sourceAnchor.y - 5)
    );
  }

  bounds(_bounds: Bounds): void {}
  avoid(_lines: Line[], _boundsExtension: BoundsExtension): void {}
  extendBounds(_extension: BoundsExtension): void {}

  get x1(): number {
    return this.sourceAnchor.x;
  }
  get y1(): number {
    return this.sourceAnchor.y;
  }
  get x2(): number {
    return this.targetAnchor.x;
  }
  get y2(): number {
    return this.targetAnchor.y;
  }

  get minimumLength(): number {
    return 10 + Label.textLength(this.name);
  }

  get leftEdge(): number {
    return Math.min(this.x1, this.x2);
  }
  get topEdge(): number {
    return Math.min(this.y1, this.y2);
  }
  get rightEdge(): number {
    return Math.max(this.x1, this.x2);
  }
  get bottomEdge(): number {
    return Math.max(this.y1, this.y2);
  }

  get sidesToClear(): Side[] {
    return [];
  }

  shouldClear(side: Side): boolean {
    return this.sidesToClear.includes(side);
  }

  clearanceGroup(_side: Side): number {
    throw new Error(
      `${this.constructor.name}: No clearance group specified for ${_side.constructor.name}`
    );
  }

  clearancePrecedence(_side: Side): (number | string)[] {
    throw new Error(
      `${this.constructor.name}: No clearance precedence specified for ${_side.constructor.name}`
    );
  }

  anchorPrecedence(side: Side): (number | string)[] {
    return this.clearancePrecedence(side);
  }

  clear(side: Side, distance: number): void {
    this.clearanceMap.set(side, distance);
  }

  addClearanceFrom(side: Side, distance: number): void {
    this.clear(side, this.clearanceFrom(side) + distance);
  }

  clearanceFrom(side: Side): number {
    return this.clearanceMap.get(side) ?? 0;
  }

  abstract attach(): this;
  abstract toSvg(): string;

  protected svgRightArrow(x: number, y: number): string {
    return `<polygon fill='black' stroke='black' points='${x},${y} ${x - 6},${y + 3} ${x - 6},${y - 3} ${x},${y}' />`;
  }

  protected svgDownArrow(x: number, y: number): string {
    return `<polygon fill='black' stroke='black' points='${x},${y} ${x - 3},${y - 6} ${x + 3},${y - 6} ${x},${y}' />`;
  }

  protected svgUpArrow(x: number, y: number): string {
    return `<polygon fill='black' stroke='black' points='${x},${y} ${x - 3},${y + 6} ${x + 3},${y + 6} ${x},${y}' />`;
  }

  protected svgLine(x1: number, y1: number, x2: number, y2: number): string {
    return `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='black' />`;
  }

  protected svgDashedLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string {
    return `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='black' stroke-dasharray='5,5' />`;
  }
}

export type LineFactory = {
  makeLine(
    source: Box,
    target: Box,
    callback: (line: Line) => void
  ): void;
};
