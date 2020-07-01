import { formatMessage, Color } from '../stdio';

export class ElementNotFoundError extends Error {
  name = 'ElementNotFoundError';

  constructor(url: string, selector: string) {
    super();
    this.message = formatMessage`Could not find any HTML elements matching ${[selector, Color.BRIGHT]} in ${[url, Color.BRIGHT]} ${
      Color.RED
    }`;
  }
}
