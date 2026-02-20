import { Line, type LineFactory } from "./line";
import { Point } from "../util/point";
import {
  LeftAlignedLabel,
  RightAlignedLabel,
  CentredLabel,
  type Label,
} from "../rendering/labels";
import type { Bounds } from "../util/bounds";
import type { BoundsExtension } from "../util/bounds";
import type { Box } from "../layout/box";
import type { Side } from "../layout/sides";

// --- External Line (base) ---

export abstract class ExternalLine extends Line {
  anchorPrecedence(_side: Side): (number | string)[] {
    return [];
  }
}

// --- External Input Line ---

export class ExternalInputLine extends ExternalLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    source.leftSide.eachAnchor((anchor) => {
      if (target.leftSide.expectsName(anchor.name)) {
        callback(new ExternalInputLine(source, target, anchor.name));
      }
    });
  }

  constructor(source: Box, target: Box, name: string) {
    super(source, target, name);
    this.clear(this.target.leftSide, 20);
  }

  attach(): this {
    this.targetAnchor = this.target.leftSide.attach(this);
    return this;
  }

  get x1(): number {
    return this.x2 - this.clearanceFrom(this.target.leftSide);
  }

  get y1(): number {
    return this.targetAnchor.y;
  }

  get y2(): number {
    return this.y1;
  }

  bounds(bounds: Bounds): void {
    this.addClearanceFrom(this.target.leftSide, this.x1 - bounds.x1 + 40);
  }

  avoid(_lines: Line[], boundsExtension: BoundsExtension): void {
    boundsExtension.west = this.minimumLength;
  }

  extendBounds(extension: BoundsExtension): void {
    this.addClearanceFrom(this.target.leftSide, extension.west);
  }

  get label(): Label {
    return new LeftAlignedLabel(
      this.name,
      new Point(this.x1 + 5, this.y1 - 5)
    );
  }

  clearanceGroup(_side: Side): number {
    return 2;
  }

  protected renderLine(x1: number, y1: number, x2: number, y2: number): string {
    return this.svgLine(x1, y1, x2, y2);
  }

  toSvg(): string {
    return [
      this.renderLine(this.x1, this.y1, this.x2, this.y2),
      this.svgRightArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}

// --- External Output Line ---

export class ExternalOutputLine extends ExternalLine {
  static makeLine(diagTarget: Box, source: Box, callback: (line: Line) => void): void {
    source.rightSide.eachAnchor((anchor) => {
      if (diagTarget.rightSide.expectsName(anchor.name)) {
        callback(new ExternalOutputLine(source, diagTarget, anchor.name));
      }
    });
  }

  constructor(source: Box, target: Box, name: string) {
    super(source, target, name);
    this.clear(this.source.rightSide, 20);
  }

  attach(): this {
    this.sourceAnchor = this.source.rightSide.attach(this);
    return this;
  }

  get x2(): number {
    return this.x1 + this.clearanceFrom(this.source.rightSide);
  }

  get y2(): number {
    return this.y1;
  }

  bounds(bounds: Bounds): void {
    this.addClearanceFrom(this.source.rightSide, bounds.x2 - this.x2 + 40);
  }

  avoid(lines: Line[], boundsExtension: BoundsExtension): void {
    let claim = 0;
    while (lines.some((other) => this.label.overlapping(other.label))) {
      claim += 20;
      this.addClearanceFrom(this.source.rightSide, 20);
    }
    this.addClearanceFrom(this.source.rightSide, -claim);
    boundsExtension.east = Math.max(this.minimumLength, claim);
  }

  extendBounds(extension: BoundsExtension): void {
    this.addClearanceFrom(this.source.rightSide, extension.east);
  }

  get label(): Label {
    return new RightAlignedLabel(
      this.name,
      new Point(this.x2 - 5, this.y2 - 5)
    );
  }

  clearanceGroup(_side: Side): number {
    return 2;
  }

  protected renderLine(x1: number, y1: number, x2: number, y2: number): string {
    return this.svgLine(x1, y1, x2, y2);
  }

  toSvg(): string {
    return [
      this.renderLine(this.x1, this.y1, this.x2, this.y2),
      this.svgRightArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}

// --- External Guidance Line ---

export class ExternalGuidanceLine extends ExternalLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    source.topSide.eachAnchor((anchor) => {
      if (target.topSide.expectsName(anchor.name)) {
        callback(new ExternalGuidanceLine(source, target, anchor.name));
      }
    });
  }

  constructor(source: Box, target: Box, name: string) {
    super(source, target, name);
    this.clear(this.target.topSide, 20);
  }

  attach(): this {
    this.targetAnchor = this.target.topSide.attach(this);
    return this;
  }

  bounds(bounds: Bounds): void {
    this.addClearanceFrom(this.target.topSide, this.y1 - bounds.y1 + 40);
  }

  avoid(lines: Line[], boundsExtension: BoundsExtension): void {
    let claim = 0;
    while (lines.some((other) => this.label.overlapping(other.label))) {
      claim += 20;
      this.addClearanceFrom(this.target.topSide, -20);
    }
    boundsExtension.north = claim;
  }

  extendBounds(extension: BoundsExtension): void {
    this.addClearanceFrom(this.target.topSide, extension.north);
  }

  get x1(): number {
    return this.targetAnchor.x;
  }

  get y1(): number {
    return this.y2 - this.clearanceFrom(this.target.topSide);
  }

  get x2(): number {
    return this.x1;
  }

  get leftEdge(): number {
    return this.label.leftEdge;
  }

  get rightEdge(): number {
    return this.label.rightEdge;
  }

  get label(): Label {
    return new CentredLabel(
      this.name,
      new Point(this.x1, this.y1 + 20 - 5)
    );
  }

  clearanceGroup(_side: Side): number {
    return 2;
  }

  protected renderLine(x1: number, y1: number, x2: number, y2: number): string {
    return this.svgLine(x1, y1, x2, y2);
  }

  toSvg(): string {
    return [
      this.renderLine(this.x1, this.y1 + 20, this.x2, this.y2),
      this.svgDownArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}

// --- External Mechanism Line ---

export class ExternalMechanismLine extends ExternalLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    source.bottomSide.eachAnchor((anchor) => {
      if (target.bottomSide.expectsName(anchor.name)) {
        callback(new ExternalMechanismLine(source, target, anchor.name));
      }
    });
  }

  constructor(source: Box, target: Box, name: string) {
    super(source, target, name);
    this.clear(this.target.bottomSide, 20);
  }

  attach(): this {
    this.targetAnchor = this.target.bottomSide.attach(this);
    return this;
  }

  bounds(bounds: Bounds): void {
    this.addClearanceFrom(this.target.bottomSide, bounds.y2 - this.y1 + 40);
  }

  avoid(lines: Line[], boundsExtension: BoundsExtension): void {
    let claim = 0;
    while (lines.some((other) => this.label.overlapping(other.label))) {
      claim += 20;
      this.addClearanceFrom(this.target.bottomSide, -20);
    }
    boundsExtension.south = claim;
  }

  extendBounds(extension: BoundsExtension): void {
    this.addClearanceFrom(this.target.bottomSide, extension.south);
  }

  get x1(): number {
    return this.targetAnchor.x;
  }

  get y1(): number {
    return this.y2 + this.clearanceFrom(this.target.bottomSide);
  }

  get x2(): number {
    return this.x1;
  }

  get leftEdge(): number {
    return this.label.leftEdge;
  }

  get rightEdge(): number {
    return this.label.rightEdge;
  }

  get label(): Label {
    return new CentredLabel(
      this.name,
      new Point(this.x1, this.y1 - 5)
    );
  }

  clearanceGroup(_side: Side): number {
    return 2;
  }

  protected renderLine(x1: number, y1: number, x2: number, y2: number): string {
    return this.svgLine(x1, y1, x2, y2);
  }

  toSvg(): string {
    return [
      this.renderLine(this.x1, this.y1 - 20, this.x2, this.y2),
      this.svgUpArrow(this.x2, this.y2),
      this.label.toSvg(),
    ].join("\n");
  }
}
