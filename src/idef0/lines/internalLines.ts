import { Line, type LineFactory } from "./line";
import { Point } from "../util/point";
import {
  LeftAlignedLabel,
  RightAlignedLabel,
  type Label,
} from "../rendering/labels";
import type { Box } from "../layout/box";
import type { ProcessBox } from "../layout/processBox";
import type { Side } from "../layout/sides";

// --- Forward Input Line ---

export class ForwardInputLine extends Line {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    const s = source as ProcessBox;
    const t = target as ProcessBox;
    if (!s.before(t)) return;
    s.rightSide.eachAnchor((anchor) => {
      if (t.leftSide.expectsName(anchor.name)) {
        callback(new ForwardInputLine(source, target, anchor.name));
      }
    });
  }

  attach(): this {
    this.sourceAnchor = this.source.rightSide.attach(this);
    this.targetAnchor = this.target.leftSide.attach(this);
    return this;
  }

  get sidesToClear(): Side[] {
    return [this.source.rightSide];
  }

  clearanceGroup(side: Side): number {
    if (side === this.source.rightSide) return 3;
    if (side === this.target.leftSide) return 1;
    return super.clearanceGroup(side);
  }

  clearancePrecedence(side: Side): (number | string)[] {
    if (side === this.source.rightSide) {
      return [2, -(this.target as ProcessBox).sequence, 2, -this.targetAnchor.sequence];
    }
    return super.clearancePrecedence(side);
  }

  anchorPrecedence(side: Side): (number | string)[] {
    if (side === this.target.leftSide) {
      return [-(this.source as ProcessBox).sequence];
    }
    // Ruby: -super → negate parent's anchor_precedence → negate this.clearancePrecedence
    return this.clearancePrecedence(side).map((v) =>
      typeof v === "number" ? -v : v
    );
  }

  private get xVertical(): number {
    return this.x1 + this.clearanceFrom(this.source.rightSide);
  }

  toSvg(): string {
    const xv = this.xVertical;
    return [
      `<path stroke='black' fill='none' d='M ${this.x1} ${this.y1} L ${xv - 10} ${this.y1} C ${xv - 5} ${this.y1} ${xv} ${this.y1 + 5} ${xv} ${this.y1 + 10} L ${xv} ${this.y2 - 10} C ${xv} ${this.y2 - 5} ${xv + 5} ${this.y2} ${xv + 10} ${this.y2} L ${this.x2} ${this.y2}' />`,
      this.svgRightArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}

// --- Backward Input Line ---

export class BackwardInputLine extends Line {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    const s = source as ProcessBox;
    const t = target as ProcessBox;
    if (!(s.after(t) || source === target)) return;
    s.rightSide.eachAnchor((anchor) => {
      if (t.leftSide.expectsName(anchor.name)) {
        callback(new BackwardInputLine(source, target, anchor.name));
      }
    });
  }

  attach(): this {
    this.sourceAnchor = this.source.rightSide.attach(this);
    this.targetAnchor = this.target.leftSide.attach(this);
    return this;
  }

  get sidesToClear(): Side[] {
    return [this.source.rightSide, this.source.bottomSide, this.target.leftSide];
  }

  clearanceGroup(side: Side): number {
    if (side === this.source.rightSide) return 3;
    if (side === this.source.bottomSide) return 1;
    if (side === this.target.leftSide) return 1;
    return super.clearanceGroup(side);
  }

  clearancePrecedence(side: Side): (number | string)[] {
    if (side === this.source.rightSide) {
      return [-(this.target as ProcessBox).sequence, -this.targetAnchor.sequence];
    }
    if (side === this.source.bottomSide) {
      return [-(this.target as ProcessBox).sequence, 2, -this.targetAnchor.sequence];
    }
    if (side === this.target.leftSide) {
      return [1];
    }
    return super.clearancePrecedence(side);
  }

  anchorPrecedence(side: Side): (number | string)[] {
    if (side === this.target.leftSide) {
      return [-(this.source as ProcessBox).sequence];
    }
    return this.clearancePrecedence(side).map((v) =>
      typeof v === "number" ? -v : v
    );
  }

  private get leftXVertical(): number {
    return this.x2 - this.clearanceFrom(this.target.leftSide);
  }

  private get rightXVertical(): number {
    return this.x1 + this.clearanceFrom(this.source.rightSide);
  }

  private get yHorizontal(): number {
    return this.source.bottomEdge + this.clearanceFrom(this.source.bottomSide);
  }

  get label(): Label {
    return new LeftAlignedLabel(
      this.name,
      new Point(this.leftXVertical + 10, this.yHorizontal - 5)
    );
  }

  toSvg(): string {
    const rxv = this.rightXVertical;
    const lxv = this.leftXVertical;
    const yh = this.yHorizontal;
    return [
      `<path stroke='black' fill='none' d='M ${this.x1} ${this.y1} L ${rxv - 10} ${this.y1} C ${rxv - 5} ${this.y1} ${rxv} ${this.y1 + 5} ${rxv} ${this.y1 + 10} L ${rxv} ${yh - 10} C ${rxv} ${yh - 5} ${rxv - 5} ${yh} ${rxv - 10} ${yh} L ${lxv + 10} ${yh} C ${lxv + 5} ${yh} ${lxv} ${yh - 5} ${lxv} ${yh - 10} L ${lxv} ${this.y2 + 10} C ${lxv} ${this.y2 + 5} ${lxv + 5} ${this.y2} ${lxv + 10} ${this.y2} L ${this.x2} ${this.y2}' />`,
      this.svgRightArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}

// --- Internal Guidance Line (base) ---

abstract class InternalGuidanceLine extends Line {
  attach(): this {
    this.sourceAnchor = this.source.rightSide.attach(this);
    this.targetAnchor = this.target.topSide.attach(this);
    return this;
  }
}

// --- Forward Guidance Line ---

export class ForwardGuidanceLine extends InternalGuidanceLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    const s = source as ProcessBox;
    const t = target as ProcessBox;
    if (!s.before(t)) return;
    s.rightSide.eachAnchor((anchor) => {
      if (t.topSide.expectsName(anchor.name)) {
        callback(new ForwardGuidanceLine(source, target, anchor.name));
      }
    });
  }

  clearanceGroup(side: Side): number {
    if (side === this.source.rightSide) return 2;
    if (side === this.target.topSide) return 1;
    return super.clearanceGroup(side);
  }

  anchorPrecedence(side: Side): (number | string)[] {
    if (side === this.target.topSide) {
      return [-(this.source as ProcessBox).sequence, -this.sourceAnchor.sequence];
    }
    if (side === this.source.rightSide) {
      return [-(this.target as ProcessBox).sequence, this.sourceAnchor.sequence];
    }
    return super.anchorPrecedence(side);
  }

  toSvg(): string {
    return [
      `<path stroke='black' fill='none' d='M ${this.x1} ${this.y1} L ${this.x2 - 10} ${this.y1} C ${this.x2 - 5} ${this.y1} ${this.x2} ${this.y1 + 5} ${this.x2} ${this.y1 + 10} L ${this.x2} ${this.y2}' />`,
      this.svgDownArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}

// --- Backward Guidance Line ---

export class BackwardGuidanceLine extends InternalGuidanceLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    const s = source as ProcessBox;
    const t = target as ProcessBox;
    if (!(s.after(t) || source === target)) return;
    s.rightSide.eachAnchor((anchor) => {
      if (t.topSide.expectsName(anchor.name)) {
        callback(new BackwardGuidanceLine(source, target, anchor.name));
      }
    });
  }

  get topEdge(): number {
    return this.yHorizontal;
  }

  get rightEdge(): number {
    return this.xVertical;
  }

  get sidesToClear(): Side[] {
    return [this.target.topSide, this.source.rightSide];
  }

  clearanceGroup(side: Side): number {
    if (side === this.source.rightSide) return 1;
    if (side === this.target.topSide) return 3;
    return super.clearanceGroup(side);
  }

  clearancePrecedence(side: Side): (number | string)[] {
    if (side === this.source.rightSide) {
      return [1, -(this.target as ProcessBox).sequence, this.sourceAnchor.sequence];
    }
    if (side === this.target.topSide) {
      return [1, (this.source as ProcessBox).sequence, -this.targetAnchor.sequence];
    }
    return super.clearancePrecedence(side);
  }

  anchorPrecedence(side: Side): (number | string)[] {
    if (side === this.target.topSide) {
      return super.anchorPrecedence(side).map((v) =>
        typeof v === "number" ? -v : v
      );
    }
    return super.anchorPrecedence(side);
  }

  private get xVertical(): number {
    return this.x1 + this.clearanceFrom(this.source.rightSide);
  }

  private get yHorizontal(): number {
    return this.y2 - this.clearanceFrom(this.target.topSide);
  }

  get label(): Label {
    return new RightAlignedLabel(
      this.name,
      new Point(this.rightEdge - 10, this.yHorizontal - 5 + 20)
    );
  }

  toSvg(): string {
    const xv = this.xVertical;
    const yh = this.yHorizontal;
    return [
      `<path stroke='black' fill='none' d='M ${this.x1} ${this.y1} L ${xv - 10} ${this.y1} C ${xv - 5} ${this.y1} ${xv} ${this.y1 - 5} ${xv} ${this.y1 - 10} L ${xv} ${yh + 10} C ${xv} ${yh + 5} ${xv - 5} ${yh} ${xv - 10} ${yh} L ${this.x2 + 10} ${yh} C ${this.x2 + 5} ${yh} ${this.x2} ${yh + 5} ${this.x2} ${yh + 10} L ${this.x2} ${this.y2}' />`,
      this.svgDownArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}

// --- Internal Mechanism Line (base) ---

abstract class InternalMechanismLine extends Line {
  attach(): this {
    this.sourceAnchor = this.source.rightSide.attach(this);
    this.targetAnchor = this.target.bottomSide.attach(this);
    return this;
  }

  protected get xVertical(): number {
    return this.x1 + this.clearanceFrom(this.source.rightSide);
  }

  protected abstract get yHorizontal(): number;

  get bottomEdge(): number {
    return this.yHorizontal;
  }
}

// --- Forward Mechanism Line ---

export class ForwardMechanismLine extends InternalMechanismLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    const s = source as ProcessBox;
    const t = target as ProcessBox;
    if (!s.before(t)) return;
    s.rightSide.eachAnchor((anchor) => {
      if (t.bottomSide.expectsName(anchor.name)) {
        callback(new ForwardMechanismLine(source, target, anchor.name));
      }
    });
  }

  protected get yHorizontal(): number {
    return this.y2 + this.clearanceFrom(this.target.bottomSide);
  }

  get label(): Label {
    return new LeftAlignedLabel(
      this.name,
      new Point(this.xVertical + 10, this.yHorizontal - 5)
    );
  }

  get sidesToClear(): Side[] {
    return [this.source.rightSide, this.target.bottomSide];
  }

  clearanceGroup(side: Side): number {
    if (side === this.source.rightSide) return 3;
    if (side === this.target.bottomSide) return 1;
    return super.clearanceGroup(side);
  }

  clearancePrecedence(side: Side): (number | string)[] {
    if (side === this.source.rightSide) {
      return [2, -(this.target as ProcessBox).sequence, 1, -this.targetAnchor.sequence];
    }
    if (side === this.target.bottomSide) {
      return [-(this.source as ProcessBox).sequence, 1, this.targetAnchor.sequence];
    }
    return super.clearancePrecedence(side);
  }

  anchorPrecedence(side: Side): (number | string)[] {
    if (side === this.source.rightSide) {
      return super.anchorPrecedence(side).map((v) =>
        typeof v === "number" ? -v : v
      );
    }
    return super.anchorPrecedence(side);
  }

  toSvg(): string {
    const xv = this.xVertical;
    const yh = this.yHorizontal;
    return [
      `<path stroke='black' fill='none' d='M ${this.x1} ${this.y1} L ${xv - 10} ${this.y1} C ${xv - 5} ${this.y1} ${xv} ${this.y1 + 5} ${xv} ${this.y1 + 10} L ${xv} ${yh - 10} C ${xv} ${yh - 5} ${xv + 5} ${yh} ${xv + 10} ${yh}  L ${this.x2 - 10} ${yh} C ${this.x2 - 5} ${yh} ${this.x2} ${yh - 5} ${this.x2} ${yh - 10} L ${this.x2} ${this.y2}' />`,
      this.svgUpArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}

// --- Backward Mechanism Line ---

export class BackwardMechanismLine extends InternalMechanismLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    const s = source as ProcessBox;
    const t = target as ProcessBox;
    if (!(s.after(t) || source === target)) return;
    s.rightSide.eachAnchor((anchor) => {
      if (t.bottomSide.expectsName(anchor.name)) {
        callback(new BackwardMechanismLine(source, target, anchor.name));
      }
    });
  }

  protected get yHorizontal(): number {
    return this.source.bottomEdge + this.clearanceFrom(this.source.bottomSide);
  }

  get rightEdge(): number {
    return this.xVertical;
  }

  get sidesToClear(): Side[] {
    return [this.source.rightSide, this.source.bottomSide];
  }

  clearanceGroup(side: Side): number {
    if (side === this.source.rightSide) return 3;
    if (side === this.target.bottomSide) return 3;
    if (side === this.source.bottomSide) return 1;
    return super.clearanceGroup(side);
  }

  clearancePrecedence(side: Side): (number | string)[] {
    if (side === this.source.rightSide) {
      return [-(this.target as ProcessBox).sequence, -this.targetAnchor.sequence];
    }
    if (side === this.source.bottomSide) {
      return [-(this.target as ProcessBox).sequence, 2, -this.targetAnchor.sequence];
    }
    return super.clearancePrecedence(side);
  }

  anchorPrecedence(side: Side): (number | string)[] {
    if (side === this.target.bottomSide) {
      return [-(this.source as ProcessBox).sequence];
    }
    return super.anchorPrecedence(side);
  }

  get label(): Label {
    return new RightAlignedLabel(
      this.name,
      new Point(this.rightEdge - 10, this.yHorizontal - 5)
    );
  }

  toSvg(): string {
    const xv = this.xVertical;
    const yh = this.yHorizontal;
    return [
      `<path stroke='black' fill='none' d='M ${this.x1} ${this.y1} L ${xv - 10} ${this.y1} C ${xv - 5} ${this.y1} ${xv} ${this.y1 + 5} ${xv} ${this.y1 + 10} L ${xv} ${yh - 10} C ${xv} ${yh - 5} ${xv - 5} ${yh} ${xv - 10} ${yh} L ${this.x2 + 10} ${yh} C ${this.x2 + 5} ${yh} ${this.x2} ${yh - 5} ${this.x2} ${yh - 10} L ${this.x2} ${this.y2}' />`,
      this.svgUpArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}
