// Why do we have this? https://v3.vuejs.org/guide/typescript-support.html#sfc-shims
declare module '*.vue' {
    import { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}
