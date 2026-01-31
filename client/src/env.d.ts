/// <reference types="vite/client" />

// 扩展 pinia 以支持 persist 选项
import 'pinia'

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | {
      key?: string
      storage?: Storage
      pick?: string[]
      omit?: string[]
      beforeRestore?: (ctx: any) => void
      afterRestore?: (ctx: any) => void
      debug?: boolean
    }
  }
}
