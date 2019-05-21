import Vue from "vue";
import Vuex from "vuex";
import { IStore, IClassNode } from "./types";
import { ClassUtils } from "./utils/ClassUtils";

Vue.use(Vuex);

export default new Vuex.Store<IStore>({
  state: {
    classes: []
  },
  mutations: {
    addClasses(state, classes: IClassNode[]) {
      state.classes = classes.reduce<IClassNode[]>((prev, item) => {
        if (!state.classes.includes(item)) {
          return [
            ...prev,
            item
          ];
        }
        return prev;
      }, []);
    }
  },
  actions: {
    addClasses({ commit }, classes: IClassNode[]) {
      commit("addClasses", classes);
    },
    /**
     * Get the classes from the server
     */
    async getClasses({ commit }) {
      const res = await fetch("http://localhost:4000/rest/cms/");
      const classes: IClassNode[] = await res.json();
      // Set the received name to the current name
      classes.map((classNode) => {
        classNode.ReceivedName = classNode.Name;
      });
      // Make relation to existing classes (not used)
      ClassUtils.makeRelations(classes);
      commit("addClasses", classes);
    }
  }
});
