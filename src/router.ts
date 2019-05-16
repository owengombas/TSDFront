import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import Editor from "./views/Editor.vue";
import Creator from "./views/Creator.vue";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/edit/:ClassName",
      name: "editor",
      component: Editor,
    },
    {
      path: "/new",
      name: "new",
      component: Creator,
    }
  ]
});
