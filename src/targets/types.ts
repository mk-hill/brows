export enum ContentType {
  TEXT_CONTENT = 'textContent',
  OUTER_HTML = 'outerHTML',
}

export interface Target {
  name?: string;
  url: string;
  selector: string;
  contentType: ContentType;
  allMatches: boolean;
  delim: string;
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

export const isValidTargetEntry = ([key, value]: [string, unknown]): boolean => {
  switch (key) {
    case 'name':
    case 'url':
    case 'selector':
    case 'delim':
      return typeof value === 'string';
    case 'forceBrowser':
    case 'allMatches':
      return typeof value === 'boolean';
    case 'contentType':
      return Object.values(ContentType).includes(value as ContentType);
    case 'members':
      return Array.isArray(value) && value.every((member) => typeof member === 'string');
    default:
      return false;
  }
};

export const isGroup = (target: Target | TargetGroup): target is TargetGroup => !!target.members?.length;

export const isValidGroupEntry = ([name, members]: [string, unknown]): boolean => {
  return (
    !!name &&
    typeof name === 'string' &&
    !!members &&
    Array.isArray(members) &&
    members.every((member) => typeof member === 'string')
  );
};
