/**
 * Type definitions for IDEF0 models
 */

/**
 * Arrow/ICOM types in IDEF0
 */
export enum ArrowType {
    Input = 'input',
    Control = 'control',
    Output = 'output',
    Mechanism = 'mechanism'
}

/**
 * Metadata for the diagram
 */
export interface Metadata {
    title?: string;
    author?: string;
    version?: string;
    description?: string;
}

/**
 * An ICOM arrow (Input, Control, Output, or Mechanism)
 */
export interface ICOM {
    label: string;
    code?: string;  // Optional code for cross-referencing between activities
}

/**
 * An activity/function box in IDEF0
 */
export interface Activity {
    code: string;
    label: string;
    inputs?: ICOM[];
    controls?: ICOM[];
    outputs?: ICOM[];
    mechanisms?: ICOM[];
    position?: Position;  // Calculated by layout engine
}

/**
 * Position coordinates
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * Complete IDEF0 diagram model
 */
export interface IDEF0Model {
    metadata?: Metadata;
    activities: Activity[];
}

/**
 * Internal representation of a connection between activities
 * Generated during layout from ICOM codes
 */
export interface Connection {
    type: ArrowType;
    from: string;      // Activity code or 'external'
    to: string;        // Activity code
    label: string;
    fromCode?: string; // ICOM code if applicable
    toCode?: string;   // ICOM code if applicable
    points?: Position[]; // Calculated by layout engine
}

/**
 * Validation error
 */
export interface ValidationError {
    message: string;
    line?: number;
    column?: number;
    severity: 'error' | 'warning';
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

/**
 * Layout result with positioned elements and resolved connections
 */
export interface LayoutResult {
    activities: Activity[];
    connections: Connection[];
    bounds: {
        width: number;
        height: number;
    };
}

/**
 * Export options
 */
export interface ExportOptions {
    format: 'svg' | 'png';
    scale?: number;
    width?: number;
    height?: number;
}
