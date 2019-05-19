import {
  Accessor,
  INode,
  IRelation,
  IStaticRelation
} from ".";

export interface IFieldNode extends INode {
  Accessors: Accessor[];
  TypeName: string;
  DefaultValue?: any;
  IsArray: boolean;
  IsNullable: boolean;
  Primary: boolean;
  Relation?: IRelation;
  StaticRelation?: IStaticRelation;
  Errors: string[];
}
