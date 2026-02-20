import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { Statement } from "../src/idef0/model/statement";
import { Process } from "../src/idef0/model/process";

const fixturesDir = path.join(__dirname, "fixtures");

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("Integration: idef0-concepts", () => {
  const text = loadFixture("idef0-concepts.idef0");
  const stmts = Statement.parse(text);
  const root = Process.parse(stmts);

  it("parses correctly", () => {
    expect(root.name).toBe("Function");
    expect(stmts).toHaveLength(4);
  });

  it("generates schematic SVG", () => {
    const svg = root.schematic().toSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("Function");
    expect(svg).toContain("Input");
    expect(svg).toContain("Output");
    expect(svg).toContain("Control");
    expect(svg).toContain("Mechanism");
  });
});

describe("Integration: cook-pizza", () => {
  const text = loadFixture("cook-pizza.idef0");
  const stmts = Statement.parse(text);
  const root = Process.parse(stmts);

  it("parses correctly", () => {
    expect(root.name).toBe("__root__");
    expect(stmts.length).toBeGreaterThan(10);
  });

  it("generates schematic SVG", () => {
    const svg = root.schematic().toSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("Cook Pizza");
    expect(svg).toContain("Take Order");
    expect(svg).toContain("Eat Pizza");
  });
});

describe("Integration: operate bens burgers", () => {
  const text = loadFixture("operate bens burgers.idef0");
  const stmts = Statement.parse(text);
  const root = Process.parse(stmts);

  it("parses all statements", () => {
    expect(stmts.length).toBeGreaterThan(80);
  });

  it("has correct root", () => {
    expect(root.name).toBe("Operate Ben's Burgers");
  });

  it("has nested children", () => {
    expect(root.isDecomposable()).toBe(true);
    expect(root.find("Manage Local Restaurant")).not.toBeNull();
    expect(root.find("Order Supplies")).not.toBeNull();
    expect(root.find("Evaluate Suppliers")).not.toBeNull();
  });

  it("generates schematic SVG", () => {
    const svg = root.schematic().toSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("Serve Customers");
  });

  it("generates decompose SVG", () => {
    const svg = root.decompose().toSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("Oversee Business Operations");
  });

  it("generates focus SVG for a child", () => {
    const child = root.find("Manage Local Restaurant")!;
    const svg = child.focus().toSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("Manage Local Restaurant");
  });

  it("generates TOC", () => {
    const toc = root.toc();
    expect(toc).toContain("Operate Ben's Burgers");
    expect(toc).toContain("  Oversee Business Operations");
    expect(toc).toContain("    Evaluate Suppliers");
  });
});
