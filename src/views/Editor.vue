<template>
  <div class="editor" v-if="selected">
    <section>
      <h1>Class</h1>
      <input :disabled="editing" type="text" placeholder="ClassName" v-model="selected.Name" @input="checkClassName">
    </section>

    <section>
      <h1>Fields</h1>
      <div
      v-for="(item, index) in selected.Fields"
      :key="index"
      class="field">
        <div v-for="(item, index2) in relationField(item)" :key="index2">
          <div v-if="item.Primary">
            Primary key
          </div>
          <div v-if="relationField(item).length > 1">
            Relation to {{ item.TypeName }} ({{ relationType(item) }})
          </div>
          <input
          type="text"
          placeholder="FieldName"
          v-model="item.Name"
          @input="checkFieldName"
          :disabled="item.Primary && editing">
          <select
          @change="checkRelation(item)"
          v-model="item.TypeName"
          :disabled="item.Primary || index2 > 0">
            <option v-for="(item, index) in allTypes" :key="index">
              {{ item }}
            </option>
          </select>
          <label>
            <input type="checkbox" v-model="item.IsArray" :disabled="item.Primary"/>
            Array
          </label>
          <label>
            <input type="checkbox" v-model="item.IsNullable" :disabled="item.Primary"/>
            Nullable
          </label>
          <label v-if="!editing && !item.Relation && index2 < 1">
            <input
            type="radio"
            name="primary"
            :value="index"
            @change="primaryChange(index)"
            :v-model="primaryIndex"
            :checked="primaryIndex === index"/>
            PK
          </label>
        </div>
      </div>
    </section>

    <section>
      <button @click="addField">
        New field
      </button>
      <button @click="send" :disabled="errors.length > 0">
        {{ editing ? "Edit" : "Create" }}
      </button>
      <div v-for="(item, index) in errors" :key="index">
        {{ item }}
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
  private types: string[] = [
    "string",
    "number",
    "boolean"
  ];
  private editing: boolean = false;
  private errors: string[] = [];

  private get allTypes() {
    return [
      ...this.types,
      ...this.classes.map((aClass) => aClass.Name)
    ];
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

  private relationField(item: IFieldNode) {
    const arr = [item];
    if (item.Relation) {
      arr.push(item.Relation.FieldNode);
    }
    return arr;
  }

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
        ReceivedName: "NewClass"
      };
      this.getClasses();
    }
  }

  private checkClassName() {
    this.isEditing();
    this.classNameAlreadyExists();
  }

  private checkFieldName() {
    const okay = !!this.selected!.Fields.find((field) => {
      return !!this.selected!.Fields.find((field2) =>
        field2.Name.toLowerCase() === field.Name.toLowerCase() && field !== field2
      );
    });
    this.AddRemoveError("FieldName already exists", okay);
  }

  private classNameAlreadyExists() {
    const okay = this.creatingClasses.filter((classNode) => {
      return classNode.Name.toLowerCase() === this.selected!.Name.toLowerCase();
    }).length > 1;
    this.AddRemoveError("ClassName already exists", okay);
  }

  private isEditing() {
    this.editing = this.selected!.ReceivedName!.toLowerCase() === this.selected!.Name.toLowerCase();
  }

  private AddRemoveError(msg: string, add: boolean) {
    const errorIndex = this.errors.indexOf(msg);
    if (errorIndex > -1) {
      if (!add) {
        this.errors.splice(errorIndex, 1);
      }
    } else if (add) {
      this.errors.push(msg);
    }
  }

  private addField() {
    const primary = this.primaryIndex < 0 ? true : false;
    this.selected!.Fields.push({
      Accessors: [],
      TypeName: primary ? "number" : this.types[0],
      DefaultValue: undefined,
      IsArray: false,
      IsNullable: false,
      Decorators: [],
      Name: "NewField",
      Primary: primary
    });
  }

  private primaryChange(index: number) {
    this.selected!.Fields[this.primaryIndex].Primary = false;
    const field = this.selected!.Fields[index];
    field.Primary = true;
    field.TypeName = "number";
    field.IsNullable = false;
    field.IsArray = false;
  }

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

  private async send() {
    if (this.selected) {
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
                  FieldNode: field.Relation.FieldNode
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
      this.selected = await res.json();
      this.selected!.ReceivedName = this.selected!.Name;
      this.editing = true;
    }
  }

  private redirectToHome() {
    this.$router.replace("/");
  }
}
</script>

<style lang="scss" scoped>
.editor {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-direction: column;
}

.field {
  margin-top: 10px;
  margin-bottom: 10px;
}

section {
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 20px;
  min-width: 500px;
}

button {
  margin-top: 10px;
}
</style>
