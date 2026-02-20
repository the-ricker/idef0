export class Bounds {
  constructor(
    readonly x1: number,
    readonly y1: number,
    readonly x2: number,
    readonly y2: number
  ) {}
}

export class BoundsExtension {
  private _north = 0;
  private _south = 0;
  private _east = 0;
  private _west = 0;

  get north(): number {
    return this._north;
  }
  set north(value: number) {
    if (value > this._north) this._north = value;
  }

  get south(): number {
    return this._south;
  }
  set south(value: number) {
    if (value > this._south) this._south = value;
  }

  get east(): number {
    return this._east;
  }
  set east(value: number) {
    if (value > this._east) this._east = value;
  }

  get west(): number {
    return this._west;
  }
  set west(value: number) {
    if (value > this._west) this._west = value;
  }
}
