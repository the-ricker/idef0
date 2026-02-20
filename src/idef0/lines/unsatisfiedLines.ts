import { Line } from "./line";
import {
  ExternalInputLine,
  ExternalOutputLine,
  ExternalGuidanceLine,
  ExternalMechanismLine,
} from "./externalLines";
import type { Box } from "../layout/box";

// --- Unsatisfied Input Line ---

export class UnsatisfiedInputLine extends ExternalInputLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    target.leftSide.eachUnattachedAnchor((anchor) => {
      source.leftSide.expects(anchor.name);
      callback(new UnsatisfiedInputLine(source, target, anchor.name));
    });
  }

  protected renderLine(x1: number, y1: number, x2: number, y2: number): string {
    return this.svgDashedLine(x1, y1, x2, y2);
  }
}

// --- Unsatisfied Output Line ---

export class UnsatisfiedOutputLine extends ExternalOutputLine {
  static makeLine(diagTarget: Box, source: Box, callback: (line: Line) => void): void {
    source.rightSide.eachUnattachedAnchor((anchor) => {
      diagTarget.rightSide.expects(anchor.name);
      callback(new UnsatisfiedOutputLine(source, diagTarget, anchor.name));
    });
  }

  protected renderLine(x1: number, y1: number, x2: number, y2: number): string {
    return this.svgDashedLine(x1, y1, x2, y2);
  }
}

// --- Unsatisfied Guidance Line ---

export class UnsatisfiedGuidanceLine extends ExternalGuidanceLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    target.topSide.eachUnattachedAnchor((anchor) => {
      source.topSide.expects(anchor.name);
      callback(new UnsatisfiedGuidanceLine(source, target, anchor.name));
    });
  }

  protected renderLine(x1: number, y1: number, x2: number, y2: number): string {
    return this.svgDashedLine(x1, y1, x2, y2);
  }
}

// --- Unsatisfied Mechanism Line ---

export class UnsatisfiedMechanismLine extends ExternalMechanismLine {
  static makeLine(source: Box, target: Box, callback: (line: Line) => void): void {
    target.bottomSide.eachUnattachedAnchor((anchor) => {
      source.bottomSide.expects(anchor.name);
      callback(new UnsatisfiedMechanismLine(source, target, anchor.name));
    });
  }

  protected renderLine(x1: number, y1: number, x2: number, y2: number): string {
    return this.svgDashedLine(x1, y1, x2, y2);
  }
}
