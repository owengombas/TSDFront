<template>
  <div class="editor" v-if="current">
    <section>
      <h1>Class</h1>
      <input
      type="text"
      placeholder="ClassName"
      v-model="current.Name"
      @input="checkClassName">
      {{error}}

      <button
      :disabled="error"
      @click="send">
        Next
      </button>
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
  private current!: IClassNode;
  private classes!: IClassNode[];
  private error: string | null = null;

  private async created() {
    this.current = {
      Imports: [],
      Fields: [],
      Export: {
        export: true,
        default: false
      },
      Decorators: [],
      Name: "NewClass",
      Path: ""
    };
    this.checkClassName();
  }

  private checkClassName() {
    this.error = null;
    const exists = [
      ...this.classes,
      this.current
    ].filter((classNode) => {
      return classNode.Name.toLowerCase() === this.current!.Name.toLowerCase();
    }).length > 1;
    if (exists) {
      this.error = "ClassName already exists";
    }
  }

  private async send() {
    const fetchInfos: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.current)
    };
    await fetch("http://localhost:4000/rest/cms", fetchInfos);
    await this.getClasses();
    this.$router.replace(`/edit/${this.current.Name}`);
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
