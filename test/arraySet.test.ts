import { describe, it, expect } from "vitest";
import { ArraySet } from "../src/idef0/util/arraySet";

describe("ArraySet", () => {
  it("adds items without duplicates", () => {
    const set = new ArraySet<number>();
    set.add(1);
    set.add(2);
    set.add(1);
    expect(set.count).toBe(2);
    expect(set.toArray()).toEqual([1, 2]);
  });

  it("deletes items (returns new set)", () => {
    const set = new ArraySet([1, 2, 3]);
    const result = set.delete(2);
    expect(result.count).toBe(2);
    expect(result.toArray()).toEqual([1, 3]);
    expect(set.count).toBe(3); // original unchanged
  });

  it("inserts at index", () => {
    const set = new ArraySet([1, 2, 3]);
    const result = set.insert(1, 4);
    expect(result.toArray()).toEqual([1, 4, 2, 3]);
  });

  it("insert moves existing item to new position", () => {
    const set = new ArraySet([1, 2, 3]);
    const result = set.insert(0, 3);
    expect(result.toArray()).toEqual([3, 1, 2]);
  });

  it("selects items matching predicate", () => {
    const set = new ArraySet([1, 2, 3, 4]);
    const evens = set.select((n) => n % 2 === 0);
    expect(evens.toArray()).toEqual([2, 4]);
  });

  it("sorts by key function", () => {
    const set = new ArraySet([3, 1, 2]);
    const sorted = set.sortBy((n) => n);
    expect(sorted.toArray()).toEqual([1, 2, 3]);
  });

  it("groups by key function", () => {
    const set = new ArraySet([1, 2, 3, 4]);
    const groups = set.groupBy((n) => n % 2);
    expect(groups.get(0)!.toArray()).toEqual([2, 4]);
    expect(groups.get(1)!.toArray()).toEqual([1, 3]);
  });

  it("sequences items", () => {
    const items = [
      { name: "a", sequence: -1 },
      { name: "b", sequence: -1 },
      { name: "c", sequence: -1 },
    ];
    const set = new ArraySet(items);
    set.sequenceItems();
    expect(items[0].sequence).toBe(0);
    expect(items[1].sequence).toBe(1);
    expect(items[2].sequence).toBe(2);
  });

  it("finds with get and factory", () => {
    const set = new ArraySet<{ id: number }>([{ id: 1 }]);
    const found = set.get(
      (item) => item.id === 2,
      () => ({ id: 2 })
    );
    expect(found).toEqual({ id: 2 });
    expect(set.count).toBe(2);
  });

  it("unions two sets", () => {
    const a = new ArraySet([1, 2]);
    const b = new ArraySet([3, 4]);
    const c = a.union(b);
    expect(c.toArray()).toEqual([1, 2, 3, 4]);
  });

  it("reduces items", () => {
    const set = new ArraySet([1, 2, 3]);
    const sum = set.reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(6);
  });
});
