export class CollectionOptions {
  public limit?: number;
  public offset?: number;
  public sortBy?: string;
  public sortOrder?: string; // TODO: use a enum here?
  public includeDeleted?: boolean;
}