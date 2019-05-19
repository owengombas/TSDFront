import { IClassNode } from "@/types";

export class ClassUtils {
  /**
   * Used to make relations to fields and classes
   * @deprecated
   * @param classes All loaded class
   */
  public static makeRelations(classes: IClassNode[]) {
    classes.map((classWithRelation) => {
      classWithRelation.Fields.map((fieldWithRelation) => {
        if (fieldWithRelation.StaticRelation) {
          classes.map((relationClass) => {
            if (relationClass.Name === fieldWithRelation.StaticRelation!.ClassNodeName) {
              relationClass.Fields.map((relationField) => {
                if (relationField.Name === fieldWithRelation.StaticRelation!.FieldNodeName) {
                  fieldWithRelation.Relation = {
                    FieldNode: relationField,
                    ClassNode: relationClass
                  };
                }
              });
            }
          });
        }
      });
    });
  }
}
