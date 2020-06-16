export enum ContentType {
  TEXT_CONTENT = 'textContent',
  OUTER_HTML = 'outerHTML',
}

export interface BrowsOptions {
  url: string;
  selector: string;
  contentType: ContentType;
  forceBrowser?: boolean;
  verbose?: boolean;
  name?: string;
  children?: string[];
}

export interface NamedOptions extends BrowsOptions {
  name: string;
}

export interface ParentOptions {
  children: string[];
  name?: string;
}

export const isParent = (options: BrowsOptions | ParentOptions): options is ParentOptions => !!options.children?.length;
