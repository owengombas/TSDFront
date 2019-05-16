import {
  IExportRules,
  INode,
  IFieldNode,
  IImport
} from ".";

export interface IClassNode extends INode {
  Path: string;
  ReceivedName?: string;
  Imports: IImport[];
  Fields: IFieldNode[];
  Export: IExportRules;
}
