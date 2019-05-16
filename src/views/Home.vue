<template>
  <div class="home" v-if="on">
    <router-link
    v-for="(item, index) in classes"
    :key="index"
    :to="`/edit/${item.Name}`"
    class="item">
      {{item.Name}}
    </router-link>
    <router-link to="/new">
      new
    </router-link>
    <button @click="restart">
      restart
    </button>
  </div>
  <div v-else>
    Restarting server...
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapState, mapActions } from "vuex";
import { IClassNode } from "../types";

@Component({
  computed: mapState(["classes"]),
  methods: mapActions(["getClasses"])
})
export default class Home extends Vue {
  private classes!: IClassNode[];
  private getClasses!: () => Promise<any>;
  private on: boolean = true;

  public async created() {
    await this.heartBeat();
  }

  public async heartBeat() {
    try {
      await this.getHealth();
      this.on = true;
      this.getClasses();
    } catch (err) {
      this.on = false;
      setTimeout(() => this.heartBeat(), 500);
    }
  }

  public getHealth() {
    return fetch("http://localhost:4000/rest/cms/health", {
      method: "GET"
    });
  }

  private restart() {
    this.on = false;
    fetch("http://localhost:4000/rest/cms/restart", {
      method: "POST"
    });
    this.heartBeat();
  }
}
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-direction: column;
  .item {
    text-align: center;
    padding-top: 1em;
    padding-bottom: 1em;
    margin-top: 1em;
    border-radius: 0.5em;
    font-size: 1.5em;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.05);
    width: 20%;
    min-width: 250px;
    max-width: 500px;
    cursor: pointer;
  }
}
</style>
