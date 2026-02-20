import type { Line } from "./line";
import type { Box } from "../layout/box";
import {
  ForwardInputLine,
  BackwardInputLine,
  ForwardGuidanceLine,
  BackwardGuidanceLine,
  ForwardMechanismLine,
  BackwardMechanismLine,
} from "./internalLines";
import {
  ExternalInputLine,
  ExternalOutputLine,
  ExternalGuidanceLine,
  ExternalMechanismLine,
} from "./externalLines";
import {
  UnsatisfiedInputLine,
  UnsatisfiedOutputLine,
  UnsatisfiedGuidanceLine,
  UnsatisfiedMechanismLine,
} from "./unsatisfiedLines";

export type LineTypeFactory = {
  makeLine(source: Box, target: Box, callback: (line: Line) => void): void;
};

export const INTERNAL_LINE_TYPES: LineTypeFactory[] = [
  ForwardInputLine,
  ForwardGuidanceLine,
  ForwardMechanismLine,
  BackwardInputLine,
  BackwardGuidanceLine,
  BackwardMechanismLine,
];

export const EXTERNAL_LINE_TYPES: LineTypeFactory[] = [
  ExternalInputLine,
  ExternalOutputLine,
  ExternalGuidanceLine,
  ExternalMechanismLine,
];

export const UNATTACHED_LINE_TYPES: LineTypeFactory[] = [
  UnsatisfiedInputLine,
  UnsatisfiedOutputLine,
  UnsatisfiedGuidanceLine,
  UnsatisfiedMechanismLine,
];
