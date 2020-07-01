export type Coercible = Required<{ toString(): string }>;

export enum Color {
  BRIGHT = '1',
  DIM = '2',
  RED = '31',
  GREEN = '32',
  YELLOW = '33',
  CYAN = '36',
  NONE = '-1',
}

export const isColor = (s: unknown): s is Color => Object.values(Color).includes(s as Color);

export type TaggedVars = Array<Coercible | [Coercible, Color] | Color>;

export interface TemplateFn<T> {
  (rawStrings: TemplateStringsArray, ...variables: TaggedVars): T;
}

export interface WithSuccess extends TemplateFn<Promise<void>> {
  success: TemplateFn<Promise<void>>;
}
export interface WithRaw extends TemplateFn<Promise<void>> {
  raw: (message: string) => Promise<void>;
}

export interface Stdout extends WithSuccess, WithRaw {
  verbose: WithSuccess;
  sync: TemplateFn<Promise<void>>;
}

export interface Stderr extends WithRaw {
  verbose: TemplateFn<Promise<void>>;
}
