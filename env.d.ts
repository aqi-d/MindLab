/// <reference types="vite/client" />

// 👇 新增下面这段 (必须加！)
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}