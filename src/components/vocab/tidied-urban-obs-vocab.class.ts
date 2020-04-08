import {DeconstructedId} from './deconstructed-id.class';

export class TidiedUrbanObsVocab {
  public source: string; // for the benefit of the ejs docs
  public disciplines: Discipline[];
  public observableProperties: ObservableProperty[];
  public units?: Unit[];
  // TODO: have another array called otherClasses for other classes we define
  // TODO: have another array called otherProperties for other properties we define
}

class Common {
  public idExpanded: string; // the full URL, i.e. the prefix has been replaced by the base URL from the @context
  public idNoPrefix: string; // Just the unique end part of URL, e.g. 'Meterology'
  public idWithPrefix: string; // e.g. uo:Meterology
  public type: string;
  public label: string;
  public comment: string;
  public sameAs: DeconstructedId[];
  public termStatus: string;
}

class Discipline extends Common {

}

class ObservableProperty extends Common {
  public recommendedUnits: DeconstructedId[];
}

class Unit extends Common {
  public symbol: string;
}
