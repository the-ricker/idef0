import { ArraySet, compareArrays } from "../util/arraySet";
import { Point } from "../util/point";
import type { Side } from "./sides";
import type { Line } from "../lines/line";

export class Anchor {
  readonly name: string;
  sequence: number = 1;
  private readonly side: Side;
  private readonly lines: ArraySet<Line> = new ArraySet();

  constructor(side: Side, name: string) {
    this.side = side;
    this.name = name;
  }

  attach(line: Line): void {
    this.lines.add(line);
  }

  get position(): Point {
    return this.side.anchorPoint(this.sequence);
  }

  get x(): number {
    return this.position.x;
  }

  get y(): number {
    return this.position.y;
  }

  get attached(): boolean {
    return !this.lines.isEmpty();
  }

  precedence(): (number | string)[] {
    if (this.lines.isEmpty()) {
      throw new Error(
        `Unattached anchor on ${this.side.sideName}: ${this.name}`
      );
    }
    const tuples = this.lines.map((line) => {
      const group = line.clearanceGroup(this.side);
      const anchorPrec = line.anchorPrecedence(this.side);
      return [group, ...anchorPrec, line.name] as (number | string)[];
    });
    tuples.sort(compareArrays);
    return tuples[0];
  }
}
