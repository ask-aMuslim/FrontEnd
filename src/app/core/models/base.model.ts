export type Id = string;

/** ISO 8601 date/time string */
export type ISODate = string;

export interface NamedEntity {
  id: Id;
  name?: string;
}

export default Id;
