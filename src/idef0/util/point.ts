export class Point {
  static readonly origin = new Point(0, 0);

  constructor(readonly x: number, readonly y: number) {}

  translate(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }
}
