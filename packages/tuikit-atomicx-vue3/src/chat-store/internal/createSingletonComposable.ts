// packages/vue3/src/internal/createSingletonComposable.ts
// -----------------------------------------------------------------------------
// 单例 Store 的 Vue3 组合式 API 适配工厂。
// -----------------------------------------------------------------------------
//
// 和 createInstanceComposable 的区别：
//   - 这里接收的是一个**已经存在的**模块级 Store（例如 LoginStore），不是
//     factory。Store 的生命周期独立于任何组件实例。
//   - 每个调用这个 composable 的组件只做一件事：把 Store 的 state 映射到
//     自己 scope 里的 shallowRef，并在 scope dispose 时解订阅。
//   - **永远不**调用 store.destroy() —— 那是模块级 Store，全局共享，不由
//     某个组件决定是否销毁。
//
// 关于 Vue3 为什么不会遇到 React StrictMode 下那类副作用错位，请看
// createInstanceComposable.ts 的文件头注释，结论同样适用这里。

import { shallowRef, computed, onScopeDispose } from 'vue';
import type { ComputedRef } from 'vue';

function createSingletonComposable<
  TState extends object,
  TMethods extends Record<string, any>,
>(
  store: {
    getState: () => TState;
    subscribe: (cb: (state: TState, prevState: TState) => void) => () => void;
  } & TMethods,
  stateKeys: (keyof TState)[],
  methodKeys: (keyof TMethods)[],
) {
  return function useSingletonStore(): { [K in keyof TState]: ComputedRef<TState[K]> } & Pick<TMethods, (typeof methodKeys)[number]> {
    const state = shallowRef(store.getState());

    // 保存 unsub 并在 scope dispose 时调用。这里**必须**显式解订阅：
    // singleton Store 不会被销毁，没有 destroy 来「顺手清掉」listener。
    // 如果忘了这步，每次组件挂载都会累积一个永久 listener，持有本次 scope
    // 的 shallowRef 闭包 —— 妥妥的内存泄漏。
    const unsub = store.subscribe((s: TState) => {
      state.value = s as any;
    });
    onScopeDispose(unsub);

    const result: any = {};
    for (const key of stateKeys) {
      result[key] = computed(() => (state.value as TState)[key]);
    }
    for (const key of methodKeys) {
      result[key] = store[key];
    }
    return result;
  };
}

export { createSingletonComposable };
