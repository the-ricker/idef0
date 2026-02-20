import { ArraySet } from "../util/arraySet";
import { Point } from "../util/point";
import { Anchor } from "./anchor";
import type { Box } from "./box";
import type { Line } from "../lines/line";

export abstract class Side {
  margin: number = 0;
  protected anchors: ArraySet<Anchor> = new ArraySet();
  protected readonly box: Box;

  constructor(box: Box) {
    this.box = box;
  }

  get sideName(): string {
    return `${this.box.name}.${this.constructor.name}`;
  }

  eachAnchor(fn: (anchor: Anchor) => void): void {
    this.anchors.each(fn);
  }

  eachUnattachedAnchor(fn: (anchor: Anchor) => void): void {
    this.anchors
      .reject((a) => a.attached)
      .each(fn);
  }

  expects(name: string): Anchor {
    return this.anchors.get(
      (a) => a.name === name,
      () => new Anchor(this, name)
    )!;
  }

  expectsName(name: string): boolean {
    return this.anchors.any((a) => a.name === name);
  }

  attach(line: Line): Anchor {
    const anchor = this.expects(line.name);
    anchor.attach(line);
    return anchor;
  }

  sequenceAnchors(): void {
    this.anchors = this.anchors.sortBy((a) => a.precedence()).sequenceItems();
  }

  get anchorCount(): number {
    return this.anchors.count;
  }

  get x1(): number {
    return this.box.x1;
  }
  get x2(): number {
    return this.box.x2;
  }
  get y1(): number {
    return this.box.y1;
  }
  get y2(): number {
    return this.box.y2;
  }

  get width(): number {
    return this.x2 - this.x1;
  }
  get height(): number {
    return this.y2 - this.y1;
  }

  layout(lines: ArraySet<Line>): void {
    const clearanceLines = lines.select((line) => line.shouldClear(this));
    const groupMap = clearanceLines.groupBy((line) => line.clearanceGroup(this));
    const clearanceGroups = [...groupMap.values()];

    for (const group of clearanceGroups) {
      const sorted = group
        .sortBy((line) => line.clearancePrecedence(this))
        .toArray();
      sorted.forEach((line, index) => {
        line.clear(this, 20 + index * 20);
      });
    }

    const lineCounts = clearanceGroups.map((g) => g.count);
    const maxLineCount = lineCounts.length > 0 ? Math.max(...lineCounts) : 0;
    this.margin = 20 + maxLineCount * 20;
  }

  abstract anchorPoint(n: number): Point;
}

export abstract class HorizontalSide extends Side {
  abstract get y(): number;

  anchorPoint(n: number): Point {
    const baseline =
      this.x1 + this.width / 2 - (20 * (this.anchors.count - 1)) / 2;
    const x = baseline + n * 20;
    return new Point(x, this.y);
  }
}

export abstract class VerticalSide extends Side {
  abstract get x(): number;

  anchorPoint(n: number): Point {
    const baseline =
      this.y1 + this.height / 2 - (20 * (this.anchors.count - 1)) / 2;
    const y = baseline + n * 20;
    return new Point(this.x, y);
  }
}

export class TopSide extends HorizontalSide {
  get y(): number {
    return this.box.y1;
  }
  get y2(): number {
    return this.box.y1;
  }
}

export class BottomSide extends HorizontalSide {
  get y(): number {
    return this.box.y2;
  }
  get y1(): number {
    return this.box.y2;
  }
}

export class LeftSide extends VerticalSide {
  get x(): number {
    return this.box.x1;
  }
  get x2(): number {
    return this.box.x1;
  }
}

export class RightSide extends VerticalSide {
  get x(): number {
    return this.box.x2;
  }
  get x1(): number {
    return this.box.x2;
  }
}
