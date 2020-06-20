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
  members?: string[];
}

/**
 * Named but not necessarily saved yet
 */
export interface NamedTarget extends Target {
  name: string;
}

export interface TargetGroup {
  members: string[];
  name: string;
}

export const isGroup = (target: Target | TargetGroup): target is TargetGroup => !!target.members?.length;
