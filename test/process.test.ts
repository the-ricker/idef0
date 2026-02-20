import { describe, it, expect } from "vitest";
import { Statement } from "../src/idef0/model/statement";
import { Process } from "../src/idef0/model/process";

describe("Process", () => {
  it("parses a single function with dependencies", () => {
    const text = `Function receives Input
Function respects Control
Function produces Output
Function requires Mechanism`;
    const stmts = Statement.parse(text);
    const root = Process.parse(stmts);
    expect(root.name).toBe("Function");
    expect(root.isLeaf()).toBe(true);
  });

  it("parses parent-child composition", () => {
    const text = `Parent is composed of Child1
Parent is composed of Child2
Child1 receives Input
Child2 produces Output`;
    const stmts = Statement.parse(text);
    const root = Process.parse(stmts);
    expect(root.name).toBe("Parent");
    expect(root.isDecomposable()).toBe(true);
    expect(root.find("Child1")).not.toBeNull();
    expect(root.find("Child2")).not.toBeNull();
  });

  it("creates synthetic root for multiple top-level processes", () => {
    const text = `A receives X
B produces Y`;
    const stmts = Statement.parse(text);
    const root = Process.parse(stmts);
    expect(root.name).toBe("__root__");
  });

  it("generates table of contents", () => {
    const text = `Parent is composed of Child1
Parent is composed of Child2
Parent receives Input`;
    const stmts = Statement.parse(text);
    const root = Process.parse(stmts);
    const toc = root.toc();
    expect(toc).toContain("Parent");
    expect(toc).toContain("  Child1");
    expect(toc).toContain("  Child2");
  });

  it("finds nested processes", () => {
    const text = `A is composed of B
B is composed of C
C receives X`;
    const stmts = Statement.parse(text);
    const root = Process.parse(stmts);
    expect(root.find("C")).not.toBeNull();
    expect(root.find("C")!.name).toBe("C");
    expect(root.find("NonExistent")).toBeNull();
  });
});
