<template>
  <div class="editor" v-if="selected">
    <div class="notif" :class="{show: showNotif}">
      {{notif}}
    </div>

    <section>
      <h1>{{ selected.Name }}</h1>
    </section>

    <section>
      <h2>Fields</h2>
      <div
      v-for="(item, index) in selected.Fields"
      :key="index"
      class="fields">
        <div v-for="(item2, index2) in relationField(item)" :key="index2">
          <div class="comment" v-if="relationField(item2).length > 1">
            Relation to {{ item2.TypeName }} ({{ relationType(item2) }})
          </div>
          <div class="field">
            <div class="field-settings">
              <input
              type="text"
              placeholder="FieldName"
              v-model="item2.Name"
              @input="checkFieldName(item, index)"
              :disabled="item2.Primary && editing">
              <select
              v-if="!item2.Primary"
              @change="checkRelation(item2)"
              v-model="item2.TypeName"
              :disabled="item2.Primary || index2 > 0">
                <option v-for="(item, index) in allTypes" :key="index">
                  {{ item }}
                </option>
              </select>
              <label v-if="!item2.Primary && false">
                <input type="checkbox" v-model="item2.IsArray" :disabled="item2.Primary"/>
                Array
              </label>
              <label v-if="!item2.Primary">
                <input type="checkbox" v-model="item2.IsNullable" :disabled="item2.Primary"/>
                Nullable
              </label>
            </div>
            <button class="danger" @click="remove(item, index)" v-if="!item2.Primary && index2 < 1">
              Remove
            </button>
            <div v-else/>
            <label class="pk" v-if="item2.Primary">
              Primary key
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="controls">
      <button class="secondary" @click="addField">
        New field
      </button>
      <button @click="send" :disabled="errors.length > 0 || loading">
        {{ editing ? "Confirm changes" : "Create" }}
      </button>
      <div class="errors">
        <div class="error" v-for="(item, index) in errors" :key="index">
          {{ item }}
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapState, mapActions } from "vuex";
import { IClassNode, IFieldNode } from "../types";

@Component({
  computed: mapState(["classes"]),
  methods: mapActions(["getClasses"])
})
export default class Home extends Vue {
  private getClasses!: () => Promise<any>;
  private classes!: IClassNode[];
  private selected: IClassNode | null = null;
  private notif: string | null = null;
  private showNotif: boolean = false;
  private types: string[] = [
    "string",
    "number",
    "boolean"
  ];
  private editing: boolean = false;
  private loading: boolean = false;

  private get allTypes() {
    return [
      ...this.types
      // ...this.classes.map((aClass) => aClass.Name)
    ];
  }

  private get errors() {
    return this.selected!.Fields.flatMap((field, index) => {
      if (field.Errors) {
        return field.Errors.map((error) => `${field.Name ? field.Name : index}: ${error}`);
      }
      return [];
    });
  }

  private get creatingClasses() {
    if (!this.editing) {
      return [
        ...this.classes,
        this.selected!
      ];
    }
    return this.classes;
  }

  private get primaryIndex() {
    return this.selected!.Fields.findIndex((field) => field.Primary);
  }

  private remove(item: IFieldNode, index: number) {
    this.selected!.Fields.splice(index, 1);
    this.selected!.Fields.map((field) => this.checkFieldName(field));
  }

  private relationField(item: IFieldNode) {
    const arr = [item];
    if (item.Relation) {
      arr.push(item.Relation.FieldNode);
    }
    return arr;
  }

  /**
   * Get the relation type to an another field
   * @deprecated
   */
  private relationType(item: IFieldNode) {
    if (item.Relation) {
      if (item.IsArray && item.Relation.FieldNode.IsArray) {
        return "Many to many";
      } else if (!item.IsArray && !item.Relation.FieldNode.IsArray) {
        return "One to one";
      } else if (item.IsArray && !item.Relation.FieldNode.IsArray) {
        return "Many to one";
      } else if (!item.IsArray && item.Relation.FieldNode.IsArray) {
        return "One to many";
      }
    }
  }

  private async created() {
    await this.getClasses();
    this.editing = this.$route.name === "editor";
    if (this.editing) {
      const className = this.$route.params.ClassName;
      if (className) {
        const classNode = this.creatingClasses.find((findClassNode) =>
          findClassNode.Name === className
        );
        if (classNode) {
          this.selected = classNode;
        } else {
          this.redirectToHome();
        }
      } else {
        this.redirectToHome();
      }
    } else {
      this.selected = {
        Imports: [],
        Fields: [],
        Export: {
          export: true,
          default: false
        },
        Decorators: [],
        Name: "NewClass",
        Path: "",
        ReceivedName: "NewClass",
      };
      this.getClasses();
    }
  }

  private checkClassName() {
    this.isEditing();
    this.classNameAlreadyExists();
  }

  /**
   * Check if field name is valid
   */
  private checkFieldName(item: IFieldNode) {
    this.addRemoveError(
      "Field format is unavailable",
      item,
      /^[a-z,A-Z]+[0-9,a-z,A-Z]*/gm.test(item.Name)
    );

    for (const field of this.selected!.Fields) {
      const dup = field.Name.toLowerCase() === item.Name.toLowerCase() && field !== item;
      this.addRemoveError("Duplicated field name", item, !dup);
      if (dup) {
        break;
      }
    }

    // RELATION CHECK
    // if (item.Relation) {
    //   const classNode = this.classes.find((classRelation) => {
    //     return classRelation.Name === item.TypeName;
    //   });
    //   if (classNode) {
    //     const dupRelation = classNode.Fields.find((findRelationField) => {
    //       return findRelationField.Name === item.Relation!.FieldNode.Name
    //     });
    //   }
    // }
  }

  /**
   * Check if the class name already exists
   * @deprecated
   */
  private classNameAlreadyExists() {
    const okay = this.creatingClasses.filter((classNode) => {
      return classNode.Name.toLowerCase() === this.selected!.Name.toLowerCase();
    }).length > 1;
  }

  /**
   * Check if the class name has been changed
   * @deprecated
   */
  private isEditing() {
    this.editing = this.selected!.ReceivedName!.toLowerCase() === this.selected!.Name.toLowerCase();
  }

  /**
   * Add or remove errors related to a field
   */
  private addRemoveError(msg: string, field: IFieldNode, remove: boolean) {
    if (!field.Errors) {
      field.Errors = [];
    }
    const index = field.Errors.indexOf(msg);
    if (index < 0 && !remove) {
      field.Errors.push(msg);
    } else if (index > -1 && remove) {
      field.Errors.splice(index, 1);
    }
    return remove;
  }

  /**
   * Add a field to the class and scroll to bottom
   */
  private addField() {
    const primary = this.primaryIndex < 0 ? true : false;
    const field = {
      Accessors: [],
      TypeName: primary ? "number" : this.types[0],
      DefaultValue: undefined,
      IsArray: false,
      IsNullable: false,
      Decorators: [],
      Name: primary ? "ID" : `NewField${this.selected!.Fields.length}`,
      Primary: primary,
      Errors: []
    };
    const length = this.selected!.Fields.push(field);
    this.checkFieldName(field);
    this.$nextTick(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  /**
   * Change the primary key field
   * @deprecated
   */
  private primaryChange(index: number) {
    this.selected!.Fields[this.primaryIndex].Primary = false;
    const field = this.selected!.Fields[index];
    field.Primary = true;
    field.TypeName = "number";
    field.IsNullable = false;
    field.IsArray = false;
  }

  /**
   * @deprecated
   */
  private checkRelation(item: IFieldNode) {
    if (!this.types.includes(item.TypeName)) {
      this.$set(item, "Relation", {
        FieldNode: {
          Accessors: [],
          TypeName: this.selected!.Name,
          IsArray: false,
          IsNullable: false,
          Primary: false,
          Decorators: [],
          Name: "RelationFieldName"
        },
        ClassNode: this.selected
      });
    }
  }

  /**
   * Send the changes to the server and display a notification
   */
  private async send() {
    if (this.selected) {
      this.loading = true;
      const datas: IClassNode = {
        ...this.selected,
        Fields: this.selected.Fields.map((field) => {
          if (field.Relation) {
            return Object.assign<{}, IFieldNode, Partial<IFieldNode>>(
              {},
              field,
              {
                Relation: undefined,
                StaticRelation: {
                  ClassNodeName: field.Relation.ClassNode.Name,
                  FieldNode: field.Relation.FieldNode,
                  FieldNodeName: field.Relation.FieldNode.Name
                }
              }
            );
          }
          return field;
        })
      };
      const fetchInfos: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datas)
      };
      const res = await fetch(`http://localhost:4000/rest/cms`, fetchInfos);
      await this.getClasses();
      const foundSelected = this.classes.find((selectedClass) =>
        selectedClass.Name === this.selected!.Name
      );
      this.selected = foundSelected || null;
      this.selected!.ReceivedName = this.selected!.Name;
      this.editing = true;
      this.loading = false;
      this.notify("Confirmed");
    }
  }

  private redirectToHome() {
    this.$router.replace("/");
  }

  /**
   * Display a notification on the top of the page
   */
  private notify(text: string) {
    this.notif = text;
    this.showNotif = true;
    setTimeout(() => {
      this.showNotif = false;
    }, 3000);
  }
}
</script>

<style lang="scss" scoped>
.field-settings {
  width: 60%;
  max-width: 800px;
  min-width: 650px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-direction: column;
}

.error {
  font-size: 1.4em;
}

.errors {
  text-align: center;
  margin-bottom: 20px;
  margin-top: 40px;
}

.fields { 
  margin-top: 20px;
  margin-bottom: 20px;
}

.field {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

section {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 20px;
  min-width: 500px;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  button {
    margin-top: 30px;
  }
}

button {
  margin-top: 10px;
}

.comment {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 10px;
}

.pk {
  font-size: 1.2em;
  font-weight: bold;
  opacity: 0.8;
  color: rgb(43, 93, 255);
}

label {
  font-size: 1.2em;
  font-weight: bold;
}

.notif {
  font-size: 1.5em;
  font-weight: bold;
  position: fixed;
  top: 10px;
  background: rgb(43, 93, 255);
  box-shadow: 0px 7px 30px 0px rgba(43, 93, 255, 0.349);
  color: white;
  border-radius: 0.3em;
  padding: 0.3em 1em;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-20%);
  transition: all 0.3s;
}

.show {
  transform: translateY(0);
  opacity: 1;
}
</style>
