import { Enumerable } from '../utils'
import { getObComponentClass } from "./observer";
import { appendState } from "./model";
import { nextTick } from "./nextTick";
import * as mobx from "mobx";

// state
class State {
  constructor(state) {
    appendState(this, state);
  }
}

// 提供一个异步进程的渲染方式
export const $next = function(fn) {
  fn = mobx.action.bound(fn);
  return nextTick(fn);
};


// 绑定注入state,$next 并设置为观察组件
export function bindState(ComponentClass) {
  if (!ComponentClass.injectMoliState) {
    class ObserverComponent extends ComponentClass {
      constructor(props, content) {
        super(props, content);
        this.state = new State(this.state)
      }
    }

    // 增加了 $next 的方法
    Enumerable(ObserverComponent.prototype, "$next", $next);

    ObserverComponent.injectMoliState = true;

    // 改写 setState
    ObserverComponent.prototype.setState = mobx.action.bound(function(data, callback) {
      for ( let name in data ) {
        this.state[name] = data[name];
      }
      callback && this.$next(callback);
    });

    return getObComponentClass(ObserverComponent)
  }

  return getObComponentClass(ComponentClass)
}
