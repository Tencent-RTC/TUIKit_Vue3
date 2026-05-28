// packages/vue3/src/internal/createInstanceComposable.ts
// -----------------------------------------------------------------------------
// 多实例 Store 的 Vue3 组合式 API 适配工厂。
// -----------------------------------------------------------------------------
//
// 为什么 Vue3 这边看起来「简单很多」—— 和 React 适配层对比
//
// React 适配层（packages/react/src/internal/createInstanceHook.ts）花了大量
// 精力处理 StrictMode 下 useMemo factory 被双调、useEffect setup/cleanup 被
// 对称演练导致 Store 泄漏的问题（详见 2026-04-20 的事故文档）。Vue3 这边
// **结构上不可能踩到同类坑**：
//
//   1. Vue 的 setup() 函数每个组件实例只运行一次。没有任何官方机制会
//      在「同一个 scope」里把它跑第二次（不像 React StrictMode 故意演练）。
//   2. onScopeDispose 的回调只在**真实**的 scope 销毁（组件卸载 / 父级
//      effectScope 停止）时触发，不会被「演练式」重放。
//   3. 方法引用我们直接透传 store 上的原函数，天然稳定 —— Vue 模板本身也
//      不依赖引用相等。
//
// 所以我们可以在 setup 体内同步 factory(arg)、同步注册副作用，这些在 React
// 里是严格禁止的做法，在 Vue 里是合法、直观、推荐的写法。
//
// -----------------------------------------------------------------------------
// 本文件里值得留意的一件事：subscribe 的 unsubscribe 必须显式解，不能靠
// store.destroy() 内部的 listeners.clear() 顺手清。
// -----------------------------------------------------------------------------
//
// 早期版本写成：
//   store.subscribe((s) => { state.value = s });       // 丢弃返回值
//   onScopeDispose(() => store.destroy());
//
// 它在今天能工作，是因为 destroy() → base.destroy() → StateManager.destroy()
// 会把所有 listener 顺手清掉。但这是**隐式依赖** core 内部实现细节。
// 以下任何一种将来可能发生的情况，都会让它静默变成 bug：
//   - core 把 destroy 语义改成「不清 listener，调用方自己管」
//   - 新增 pause/resume 类似的「订阅暂时关闭但 Store 继续存在」场景
//   - Store 引入引用计数，destroy 归零才真清 —— 则未归零时 listener 悬空
//
// 现在的写法显式保存 unsub 并在 scope dispose 里调用，既不依赖 core 细节，
// 也和 createSingletonComposable 的写法对齐。

import { shallowRef, computed, onScopeDispose } from 'vue';
import type { ComputedRef } from 'vue';

function createInstanceComposable<
  TState extends object,
  TInstance extends {
    getState: () => TState;
    subscribe: (cb: (state: TState, prevState: TState) => void) => () => void;
    destroy: () => void;
  },
  TArg = undefined,
>(
  factory: (arg?: TArg) => TInstance,
  stateKeys: (keyof TState)[],
  methodKeys: (keyof TInstance)[],
) {
  return function useInstanceStore(
    arg?: TArg,
  ): { [K in keyof TState]: ComputedRef<TState[K]> } & Pick<TInstance, (typeof methodKeys)[number]> {
    // 同步创建 Store。Vue setup 只跑一次，所以这里不会像 React StrictMode
    // 那样被双调产生两个实例。
    const store = factory(arg);

    // 把 Store 的快照映射到 Vue 的 reactive 系统。shallowRef 足够 ——
    // Store 每次 setState 产生新对象引用，这里只需要在引用变化时触发更新；
    // 对象内部的属性访问走 computed getter。
    const state = shallowRef(store.getState());

    // 保存 unsubscribe，scope dispose 时显式解订阅。见文件头注释说明为什么
    // 不能把它丢给 destroy 顺手清。
    const unsubscribe = store.subscribe((s: TState) => {
      state.value = s as any;
    });

    onScopeDispose(() => {
      unsubscribe();
      store.destroy();
    });

    const result: any = {};
    // State 字段以 ComputedRef 暴露，模板里可以直接用。
    for (const key of stateKeys) {
      result[key] = computed(() => (state.value as TState)[key]);
    }
    // 方法直接透传。Store 上的原函数天然闭包到本次 create 出来的 instance，
    // 不需要像 React 侧那样包一层「稳定代理」—— 因为 Vue 这边不存在
    // 「Store 实例跨 render 被替换」这种现象。
    for (const key of methodKeys) {
      result[key] = (store as any)[key];
    }
    return result;
  };
}

export { createInstanceComposable };
