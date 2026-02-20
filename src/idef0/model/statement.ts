const NOUN_PATTERN = "[^a-z; ][^; ]*?(?: [^a-z; ][^; ]*?)*";
const VERB_PATTERN = "[a-z][^ ]*?(?: [a-z][^ ]*?)*";
const FORMAT = new RegExp(
  `^(${NOUN_PATTERN}) (${VERB_PATTERN}) (${NOUN_PATTERN})$`
);

const NOUN_RE = new RegExp(`^${NOUN_PATTERN}$`);
const VERB_RE = new RegExp(`^${VERB_PATTERN}$`);

function squish(s: string): string | null {
  const result = s.replace(/\s+/g, " ").trim();
  return result.length > 0 ? result : null;
}

function parseNoun(text: string): string {
  const normalised = text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)[a-z]/g, (l) => l.toUpperCase());
  if (!NOUN_RE.test(normalised)) {
    throw new Error(`Invalid noun: ${JSON.stringify(text)}`);
  }
  return normalised;
}

function parseVerb(text: string): string {
  const normalised = text.replace(/\s+/g, " ").trim().toLowerCase();
  if (!VERB_RE.test(normalised)) {
    throw new Error(`Invalid verb: ${JSON.stringify(text)}`);
  }
  return normalised;
}

export class Statement {
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;

  static parse(text: string): Statement[] {
    return text
      .split("\n")
      .map((line) => squish(line))
      .filter((line): line is string => line !== null && !line.startsWith("#"))
      .map((line) => {
        const match = FORMAT.exec(line);
        if (!match) {
          throw new Error(`Invalid statement: ${JSON.stringify(line)}`);
        }
        return Statement.assemble(match[1], match[2], match[3]);
      });
  }

  static assemble(
    subject: string,
    predicate: string,
    object: string
  ): Statement {
    return new Statement(parseNoun(subject), parseVerb(predicate), parseNoun(object));
  }

  constructor(subject: string, predicate: string, object: string) {
    this.subject = subject;
    this.predicate = predicate;
    this.object = object;
  }

  toString(): string {
    return `${this.subject} ${this.predicate} ${this.object}`;
  }

  equals(other: Statement): boolean {
    return (
      this.subject === other.subject &&
      this.predicate === other.predicate &&
      this.object === other.object
    );
  }
}
