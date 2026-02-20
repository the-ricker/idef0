import { describe, it, expect } from "vitest";
import { Statement } from "../src/idef0/model/statement";

describe("Statement", () => {
  it("parses a simple statement", () => {
    const stmts = Statement.parse("Function receives Input");
    expect(stmts).toHaveLength(1);
    expect(stmts[0].subject).toBe("Function");
    expect(stmts[0].predicate).toBe("receives");
    expect(stmts[0].object).toBe("Input");
  });

  it("parses multiple statements", () => {
    const text = `Cook Pizza receives Ingredients
Cook Pizza produces Pizza
Cook Pizza requires Chef`;
    const stmts = Statement.parse(text);
    expect(stmts).toHaveLength(3);
    expect(stmts[0].subject).toBe("Cook Pizza");
    expect(stmts[1].predicate).toBe("produces");
    expect(stmts[2].object).toBe("Chef");
  });

  it("ignores comments and blank lines", () => {
    const text = `# This is a comment
Function receives Input

Function produces Output
# Another comment`;
    const stmts = Statement.parse(text);
    expect(stmts).toHaveLength(2);
  });

  it("handles 'is composed of' predicate", () => {
    const stmts = Statement.parse("Parent is composed of Child");
    expect(stmts[0].predicate).toBe("is composed of");
    expect(stmts[0].subject).toBe("Parent");
    expect(stmts[0].object).toBe("Child");
  });

  it("normalizes whitespace", () => {
    const stmts = Statement.parse("  Function   receives   Input  ");
    expect(stmts).toHaveLength(1);
    expect(stmts[0].subject).toBe("Function");
  });

  it("parses all five predicates", () => {
    const text = `F receives I
F produces O
F respects C
F requires M
F is composed of S`;
    const stmts = Statement.parse(text);
    expect(stmts.map((s) => s.predicate)).toEqual([
      "receives",
      "produces",
      "respects",
      "requires",
      "is composed of",
    ]);
  });

  it("throws on invalid input", () => {
    expect(() => Statement.parse("invalid line")).toThrow();
  });
});
