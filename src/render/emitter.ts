/**
 * 类型化的最小事件发射器（无 DOM 依赖）。
 *
 * 被 DualViewPreview 用作观察者机制：对外暴露 render / cameraChange /
 * documentChange / themeChange / destroy 等事件。泛型 `Events` 把事件名
 * 映射到它的载荷类型，从而让 on/emit 获得类型安全。
 */

type Listener<T> = (payload: T) => void;

/** 泛型事件发射器：按事件名维护监听器集合。 */
export class Emitter<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  /**
   * 注册监听器。
   * 返回：一个反注册闭包，调用它即可取消本次订阅。
   */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }

  /** 注销监听器；该事件监听器清空后把事件键一并删除。 */
  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(listener as Listener<never>);
    if (set.size === 0) this.listeners.delete(event);
  }

  /**
   * 触发事件。
   * 注意：用 `Array.from(set)` 拷贝一份再遍历，避免监听器在回调中 on/off
   * 修改集合导致迭代行为异常。
   */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of Array.from(set)) {
      (listener as Listener<Events[K]>)(payload);
    }
  }

  /** 清空所有事件的监听器。 */
  clear(): void {
    this.listeners.clear();
  }
}
