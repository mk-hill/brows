export enum ContentType {
  TEXT_CONTENT = 'textContent',
  OUTER_HTML = 'outerHTML',
}

export interface Target {
  name?: string;
  url: string;
  selector: string;
  contentType: ContentType;
  forceBrowser: boolean;
  children?: string[];
}

export interface NamedTarget extends Target {
  name: string;
}

export interface ParentTarget {
  children: string[];
  name: string;
}

export const isParent = (target: Target | ParentTarget): target is ParentTarget => !!target.children?.length;
