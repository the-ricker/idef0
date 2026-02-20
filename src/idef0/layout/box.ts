import { Point } from "../util/point";
import {
  TopSide,
  BottomSide,
  LeftSide,
  RightSide,
  type Side,
} from "./sides";
import type { ArraySet } from "../util/arraySet";
import type { Line } from "../lines/line";

export class Box {
  readonly name: string;
  protected topLeft: Point = Point.origin;
  readonly topSide: TopSide;
  readonly bottomSide: BottomSide;
  readonly leftSide: LeftSide;
  readonly rightSide: RightSide;

  constructor(name: string) {
    this.name = name;
    this.topSide = new TopSide(this);
    this.bottomSide = new BottomSide(this);
    this.leftSide = new LeftSide(this);
    this.rightSide = new RightSide(this);
  }

  moveTo(topLeft: Point): void {
    this.topLeft = topLeft;
  }

  translate(dx: number, dy: number): void {
    this.topLeft = this.topLeft.translate(dx, dy);
  }

  get x1(): number {
    return this.topLeft.x;
  }
  get y1(): number {
    return this.topLeft.y;
  }
  get x2(): number {
    return this.x1 + this.width;
  }
  get y2(): number {
    return this.y1 + this.height;
  }

  get width(): number {
    return 0;
  }
  get height(): number {
    return 0;
  }

  get leftEdge(): number {
    return this.x1;
  }
  get rightEdge(): number {
    return this.x2;
  }
  get topEdge(): number {
    return this.y1;
  }
  get bottomEdge(): number {
    return this.y2;
  }

  get sides(): Side[] {
    return [this.topSide, this.bottomSide, this.leftSide, this.rightSide];
  }

  sequenceAnchors(): void {
    for (const side of this.sides) {
      side.sequenceAnchors();
    }
  }

  layout(lines: ArraySet<Line>): void {
    for (const side of this.sides) {
      side.layout(lines);
    }
    this.translate(0, this.topSide.margin);
  }
}
