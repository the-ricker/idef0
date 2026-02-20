import { Point } from "../util/point";

export class Label {
  static textLength(text: string): number {
    return text.length * 6;
  }

  constructor(protected text: string, protected point: Point) {}

  get length(): number {
    return Label.textLength(this.text);
  }

  get leftEdge(): number {
    return this.point.x;
  }

  get topEdge(): number {
    return this.point.y - 20;
  }

  get bottomEdge(): number {
    return this.point.y;
  }

  get rightEdge(): number {
    return this.leftEdge + this.length;
  }

  overlapping(other: Label): boolean {
    return (
      this.leftEdge < other.rightEdge &&
      this.rightEdge > other.leftEdge &&
      this.topEdge < other.bottomEdge &&
      this.bottomEdge > other.topEdge
    );
  }

  protected get textAnchor(): string {
    return "start";
  }

  toSvg(): string {
    return `<text text-anchor='${this.textAnchor}' x='${this.point.x}' y='${this.point.y}'>${this.text}</text>`;
  }
}

export class LeftAlignedLabel extends Label {
  get leftEdge(): number {
    return this.point.x;
  }

  protected get textAnchor(): string {
    return "start";
  }
}

export class RightAlignedLabel extends Label {
  get leftEdge(): number {
    return this.point.x - this.length;
  }

  protected get textAnchor(): string {
    return "end";
  }
}

export class CentredLabel extends Label {
  get leftEdge(): number {
    return this.point.x - this.length / 2;
  }

  protected get textAnchor(): string {
    return "middle";
  }
}
