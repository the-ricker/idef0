import { ArraySet } from "../util/arraySet";
import { Point } from "../util/point";
import { Bounds, BoundsExtension } from "../util/bounds";
import { Box } from "./box";
import { ProcessBox } from "./processBox";
import { Line } from "../lines/line";
import {
  INTERNAL_LINE_TYPES,
  EXTERNAL_LINE_TYPES,
  UNATTACHED_LINE_TYPES,
} from "../lines/lineTypes";

export function createDiagram(
  name: string,
  populate: (diagram: Diagram) => void
): Diagram {
  const diagram = new Diagram(name);
  populate(diagram);
  diagram.createLines();
  diagram.sequenceBoxes();
  diagram.sequenceAnchors();
  diagram.layout();
  return diagram;
}

export class Diagram extends Box {
  private _width: number = 0;
  private _height: number = 0;
  private boxes: ArraySet<ProcessBox> = new ArraySet();
  private lines: ArraySet<Line> = new ArraySet();

  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }

  private resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
  }

  box(name: string): ProcessBox {
    return this.boxes.get(
      (p) => p.name === name,
      () => new ProcessBox(name)
    )! as ProcessBox;
  }

  private get diagTopEdge(): number {
    const allItems = [
      ...this.boxes.map((b) => b.topEdge),
      ...this.lines.map((l) => l.topEdge),
    ];
    return allItems.length > 0 ? Math.min(...allItems) : 0;
  }

  private get diagBottomEdge(): number {
    const allItems = [
      ...this.boxes.map((b) => b.bottomEdge),
      ...this.lines.map((l) => l.bottomEdge),
    ];
    return allItems.length > 0 ? Math.max(...allItems) : 0;
  }

  private get diagLeftEdge(): number {
    const allItems = [
      ...this.boxes.map((b) => b.leftEdge),
      ...this.lines.map((l) => l.leftEdge),
    ];
    return allItems.length > 0 ? Math.min(...allItems) : 0;
  }

  private get diagRightEdge(): number {
    const allItems = [
      ...this.boxes.map((b) => b.rightEdge),
      ...this.lines.map((l) => l.rightEdge),
    ];
    return allItems.length > 0 ? Math.max(...allItems) : 0;
  }

  createLines(): void {
    let boxes = new ArraySet<ProcessBox>();
    let lines = new ArraySet<Line>();
    let overallBackwardLineCount = 0;

    const sortedBoxes = this.boxes.sortBy((b) => b.precedence);

    sortedBoxes.each((box) => {
      let backwardLineCount: number | null = null;

      for (let index = 0; index <= boxes.count; index++) {
        const candidateBoxes = boxes.insert(index, box).sequenceItems();

        const candidateLines = candidateBoxes.reduce(
          (accLines: ArraySet<Line>, target: ProcessBox) => {
            candidateBoxes.each((source) => {
              for (const lineType of INTERNAL_LINE_TYPES) {
                lineType.makeLine(source, target, (line) => {
                  accLines.add(line);
                });
              }
            });
            return accLines;
          },
          new ArraySet<Line>()
        );

        const candidateBackwardCount = candidateLines
          .toArray()
          .filter((l) => l.isBackward()).length;

        if (
          backwardLineCount === null ||
          candidateBackwardCount < backwardLineCount
        ) {
          backwardLineCount = candidateBackwardCount;
          boxes = candidateBoxes;
          lines = candidateLines;

          if (backwardLineCount === overallBackwardLineCount) break;
          overallBackwardLineCount = backwardLineCount;
        }
      }
    });

    this.boxes = boxes;
    this.lines = lines;

    this.lines.each((line) => line.attach());

    const externalAndUnattached = [
      ...EXTERNAL_LINE_TYPES,
      ...UNATTACHED_LINE_TYPES,
    ];
    for (const lineType of externalAndUnattached) {
      this.boxes.each((box) => {
        lineType.makeLine(this, box, (line) => {
          this.lines.add(line.attach());
        });
      });
    }
  }

  sequenceBoxes(): void {
    this.boxes.sequenceItems();
  }

  sequenceAnchors(): void {
    this.boxes.each((box) => box.sequenceAnchors());
  }

  layout(): void {
    let point = this.topLeft;
    this.boxes.each((box) => {
      box.moveTo(point);
      box.layout(this.lines);
      point = new Point(
        box.x2 + box.rightSide.margin,
        box.y2 + box.bottomSide.margin
      );
    });

    const bounds = new Bounds(
      this.diagLeftEdge,
      this.diagTopEdge,
      this.diagRightEdge,
      this.diagBottomEdge
    );

    this.lines.each((line) => line.bounds(bounds));

    const extension = new BoundsExtension();
    this.lines.each((line) => {
      const others = this.lines.delete(line).toArray();
      line.avoid(others, extension);
    });

    this.lines.each((line) => line.extendBounds(extension));

    const leftEdges = this.lines.map((l) => l.leftEdge);
    const topEdges = this.lines.map((l) => l.topEdge);

    const dx =
      leftEdges.length > 0
        ? Math.max(0, ...leftEdges.filter((v) => v <= 0).map((v) => Math.abs(v)))
        : 0;
    const dy =
      topEdges.length > 0
        ? Math.max(0, ...topEdges.filter((v) => v <= 0).map((v) => Math.abs(v)))
        : 0;

    this.boxes.each((box) => box.translate(dx + 20, dy + 20));

    this.resize(this.diagRightEdge + 20, this.diagBottomEdge + 20);
  }

  toSvg(): string {
    const boxesSvg = this.boxes.map((b) => b.toSvg()).join("\n");
    const linesSvg = this.lines.map((l) => l.toSvg()).join("\n");

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN"
"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd" [
<!ATTLIST svg xmlns:xlink CDATA #FIXED "http://www.w3.org/1999/xlink">
]>
<svg xmlns='http://www.w3.org/2000/svg'
xmlns:xlink='http://www.w3.org/1999/xlink'
width='${this.width}pt' height='${this.height}pt'
viewBox='${this.x1} ${this.y1} ${this.x2} ${this.y2}'
>
<style type='text/css'>
  svg {
    background-color: white;
  }
  text {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 12px;
  }
</style>
<g>
  ${boxesSvg}
  ${linesSvg}
</g>
</svg>`;
  }
}
