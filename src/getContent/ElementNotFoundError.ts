export class ElementNotFoundError extends Error {
  name = 'ElementNotFoundError';

  constructor(url: string, selector: string) {
    super();
    this.message = `Could not find any HTML elements matching "${selector}" in "${url}"`;
  }
}
