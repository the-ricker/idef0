export function compareArrays(a: readonly (number | string)[], b: readonly (number | string)[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return a.length - b.length;
}

export class ArraySet<T> {
  private items: T[];

  constructor(items: T[] = []) {
    this.items = [...items];
  }

  get count(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  indexOf(item: T): number {
    return this.items.indexOf(item);
  }

  at(index: number): T | undefined {
    return this.items[index];
  }

  includes(item: T): boolean {
    return this.items.includes(item);
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  any(predicate: (item: T) => boolean): boolean {
    return this.items.some(predicate);
  }

  each(fn: (item: T) => void): void {
    this.items.forEach(fn);
  }

  eachWithIndex(fn: (item: T, index: number) => void): void {
    this.items.forEach(fn);
  }

  map<U>(fn: (item: T) => U): U[] {
    return this.items.map(fn);
  }

  reduce<U>(fn: (acc: U, item: T) => U, initial: U): U {
    return this.items.reduce(fn, initial);
  }

  inject<U>(initial: U, fn: (acc: U, item: T) => U): U {
    return this.items.reduce(fn, initial);
  }

  get(predicate: (item: T) => boolean, factory?: () => T): T | undefined {
    let item = this.items.find(predicate);
    if (!item && factory) {
      item = factory();
      this.add(item);
    }
    return item;
  }

  add(item: T): this {
    if (!this.items.includes(item)) {
      this.items.push(item);
    }
    return this;
  }

  push(item: T): this {
    this.items.push(item);
    return this;
  }

  delete(item: T): ArraySet<T> {
    return new ArraySet(this.items.filter(i => i !== item));
  }

  deleteMut(item: T): this {
    const idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);
    return this;
  }

  insert(index: number, item: T): ArraySet<T> {
    const copy = this.items.filter(i => i !== item);
    copy.splice(index, 0, item);
    return new ArraySet(copy);
  }

  insertMut(index: number, item: T): this {
    const idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);
    this.items.splice(index, 0, item);
    return this;
  }

  select(predicate: (item: T) => boolean): ArraySet<T> {
    return new ArraySet(this.items.filter(predicate));
  }

  reject(predicate: (item: T) => boolean): ArraySet<T> {
    return new ArraySet(this.items.filter(i => !predicate(i)));
  }

  sortBy<U extends number | string | (number | string)[]>(fn: (item: T) => U): ArraySet<T> {
    const sorted = [...this.items].sort((a, b) => {
      const va = fn(a);
      const vb = fn(b);
      if (Array.isArray(va) && Array.isArray(vb)) {
        return compareArrays(va, vb);
      }
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    });
    return new ArraySet(sorted);
  }

  groupBy<K>(fn: (item: T) => K): Map<K, ArraySet<T>> {
    const groups = new Map<K, ArraySet<T>>();
    for (const item of this.items) {
      const key = fn(item);
      let group = groups.get(key);
      if (!group) {
        group = new ArraySet<T>();
        groups.set(key, group);
      }
      group.add(item);
    }
    return groups;
  }

  partition(predicate: (item: T) => boolean): [ArraySet<T>, ArraySet<T>] {
    const yes: T[] = [];
    const no: T[] = [];
    for (const item of this.items) {
      (predicate(item) ? yes : no).push(item);
    }
    return [new ArraySet(yes), new ArraySet(no)];
  }

  sequenceItems(): this {
    this.items.forEach((item, index) => {
      (item as any).sequence = index;
    });
    return this;
  }

  union(other: ArraySet<T>): ArraySet<T> {
    const result = new ArraySet([...this.items]);
    other.each(item => result.push(item));
    return result;
  }

  plus(other: ArraySet<T>): ArraySet<T> {
    return this.union(other);
  }

  dup(): ArraySet<T> {
    return new ArraySet([...this.items]);
  }

  toArray(): T[] {
    return [...this.items];
  }

  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }
}
