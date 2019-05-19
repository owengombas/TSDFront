<template>
  <div class="editor" v-if="current">
    <section>
      <h1>Class creator</h1>
      <input
      type="text"
      placeholder="ClassName"
      v-model="current.Name"
      @input="checkClassName">
      
      <div
      class="error"
      v-html="error"/>

      <button
      :disabled="error || loading"
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
  private loading: boolean = false;

  private async created() {
    this.current = {
      Imports: [],
      Fields: [],
      Export: {
        export: true,
        default: false
      },
      Decorators: [],
      Name: `NewClass${this.classes.length}`,
      Path: ""
    };
    this.checkClassName();
  }

  /**
   * Check if the class name is correct
   */
  private checkClassName() {
    this.error = null;
    if (this.current.Name) {
      if (/^[a-z,A-Z]+[0-9,a-z,A-Z]*/gm.test(this.current.Name)) {
        const exists = [
          ...this.classes,
          this.current
        ].filter((classNode) => {
          return classNode.Name.toLowerCase() === this.current!.Name.toLowerCase();
        }).length > 1;
        if (exists) {
          this.error = "ClassName already exists";
        }
      } else {
        this.error = "ClassName doesn't have the right format<br>[a-z,A-Z]+[0-9]*";
      }
    } else {
      this.error = "ClassName musts be defined";
    }
  }

  /**
   * Create the class and redirect the user to the edit page
   */
  private async send() {
    this.loading = true;
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
    this.loading = false;
  }
}
</script>

<style lang="scss" scoped>
.editor {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  flex-direction: column;
}

.error {
  margin-top: 20px;
  text-align: center;
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
  align-items: center;
  margin-top: 20px;
  min-width: 500px;
}

button {
  margin-top: 50px;
}

input[type="text"] {
  width: 100%;
}
</style>
