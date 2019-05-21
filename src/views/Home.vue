<template>
  <div v-if="on">
    <div class="home">
      <div
      v-for="(item, index) in classes"
      :key="index"
      class="item"
      @click="$router.push(`/edit/${item.Name}`)">
        <div class="class-node">
          {{item.Name}}
        </div>
        <div class="item-controls">
          <button class="danger" @click.stop="remove(item)">Delete</button>
        </div>
      </div>
      <div class="controls">
        <router-link class="new btn" to="/new">
          Create a new class
        </router-link>
        <button class="danger restart" @click="restart">
          Restart the server
        </button>
      </div>
    </div>
  </div>
  <div class="restart-status error" v-else>
    Restarting server{{dots}}
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
  private dots = "";

  public async created() {
    await this.heartBeat();
  }

  /**
   * Wait for the server to restart by making requests to get the status
   */
  public async heartBeat() {
    try {
      await this.getHealth();
      this.on = true;
      this.getClasses();
    } catch (err) {
      this.on = false;
      setTimeout(() => {
        if (this.dots.length < 3) {
          this.dots += ".";
        } else {
          this.dots = "";
        }
        this.heartBeat();
      }, 500);
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

  /**
   * Remove a class
   */
  private async remove(item: IClassNode) {
    await fetch(`http://localhost:4000/rest/cms/${item.Name}`, {
      method: "DELETE"
    });
    this.getClasses();
  }
}
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  align-items: center;
  width: 100%;
  flex-direction: column;
  min-height: 95vh;
}

.item {
  min-width: 400px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 50%;
  margin-top: 30px;
  background: rgba(0,0,0,0.05);
  padding: 0.4em 0.7em;
  border-radius: 0.5em;
}

.class-node {
  font-weight: bold;
  font-size: 2em;
  border-radius: 0.3em;
}

.controls {
  margin-top: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.restart, .new {
  margin-top: 40px;
}

.restart-status {
  display: flex;
  font-size: 1.4em;
  height: 100vh;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>
