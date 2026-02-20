import { ArraySet } from "../util/arraySet";
import { createDiagram, Diagram } from "../layout/diagram";
import type { Statement } from "./statement";

type SideType = "left_side" | "right_side" | "top_side" | "bottom_side";

const PREDICATE_TO_SIDE: Record<string, SideType> = {
  receives: "left_side",
  produces: "right_side",
  respects: "top_side",
  requires: "bottom_side",
};

export class Process {
  readonly name: string;
  private parent: Process | null = null;
  private children: ArraySet<Process> = new ArraySet();
  private dependencies: Map<SideType, ArraySet<string>> = new Map();

  static parse(statements: Statement[]): Process {
    const processes = new Map<string, Process>();
    const getOrCreate = (name: string): Process => {
      let p = processes.get(name);
      if (!p) {
        p = new Process(name);
        processes.set(name, p);
      }
      return p;
    };

    for (const statement of statements) {
      const process = getOrCreate(statement.subject);

      if (statement.predicate === "is composed of") {
        const child = getOrCreate(statement.object);
        process.addChild(child);
      } else {
        const side = PREDICATE_TO_SIDE[statement.predicate];
        if (!side) {
          throw new Error(`Unknown dependency ${statement.predicate}`);
        }
        process.addDependency(side, statement.object);
      }
    }

    const candidateRoots = [...processes.values()].filter((p) => p.isRoot());

    if (candidateRoots.length === 1) {
      return candidateRoots[0];
    }
    return new Process("__root__", candidateRoots);
  }

  constructor(name: string, children: Process[] = []) {
    this.name = name;
    for (const child of children) {
      this.addChild(child);
    }
  }

  find(name: string): Process | null {
    if (this.name === name) return this;
    for (const child of this.children) {
      const found = child.find(name);
      if (found) return found;
    }
    return null;
  }

  isRoot(): boolean {
    return this.parent === null;
  }

  isLeaf(): boolean {
    return this.children.isEmpty();
  }

  addChild(other: Process): void {
    if (other.ancestorOf(this)) {
      throw new Error("Cyclic composition");
    }
    this.children.add(other);
    if (!other.isRoot()) {
      throw new Error("Already a child");
    }
    other.parent = this;
  }

  receives(name: string): void {
    this.addDependency("left_side", name);
  }

  produces(name: string): void {
    this.addDependency("right_side", name);
  }

  respects(name: string): void {
    this.addDependency("top_side", name);
  }

  requires(name: string): void {
    this.addDependency("bottom_side", name);
  }

  private addDependency(side: SideType, name: string): void {
    let deps = this.dependencies.get(side);
    if (!deps) {
      deps = new ArraySet<string>();
      this.dependencies.set(side, deps);
    }
    deps.add(name);
  }

  eachDependency(fn: (side: SideType, name: string) => void): void {
    for (const [side, names] of this.dependencies) {
      names.each((name) => fn(side, name));
    }
  }

  ancestorOf(other: Process): boolean {
    return (
      this.parentOf(other) ||
      this.children.any((child) => child.ancestorOf(other))
    );
  }

  parentOf(other: Process): boolean {
    return this.children.includes(other);
  }

  isDecomposable(): boolean {
    return !this.children.isEmpty();
  }

  toc(indent: string = ""): string {
    let result = indent + this.name + "\n";
    this.children.each((child) => {
      result += child.toc(indent + "  ");
    });
    return result;
  }

  decompose(): Diagram {
    if (!this.isDecomposable()) return this.focus();
    return createDiagram(this.name, (diagram) => {
      this.render(diagram);
      this.children.each((child) => {
        child.renderBox(diagram);
      });
    });
  }

  focus(): Diagram {
    const parent = this.parent ?? this;
    return createDiagram(parent.name, (diagram) => {
      parent.render(diagram);
      this.renderBox(diagram);
    });
  }

  schematic(): Diagram {
    return createDiagram(this.name, (diagram) => {
      this.eachLeaf((leaf) => {
        leaf.renderBox(diagram);
      });
    });
  }

  private renderBox(diagram: Diagram): void {
    this.render(diagram.box(this.name));
  }

  private render(boxOrDiagram: { leftSide: any; rightSide: any; topSide: any; bottomSide: any }): void {
    this.eachDependency((side, name) => {
      switch (side) {
        case "left_side":
          boxOrDiagram.leftSide.expects(name);
          break;
        case "right_side":
          boxOrDiagram.rightSide.expects(name);
          break;
        case "top_side":
          boxOrDiagram.topSide.expects(name);
          break;
        case "bottom_side":
          boxOrDiagram.bottomSide.expects(name);
          break;
      }
    });
  }

  private eachLeaf(fn: (leaf: Process) => void): void {
    if (this.isLeaf()) {
      fn(this);
      return;
    }
    this.children.each((child) => child.eachLeaf(fn));
  }
}
