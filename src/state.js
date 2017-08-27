import { isObject } from './utils'
import { getObComponentClass } from "./observer";
import { appendState } from "./model";
import * as mobx from "mobx";


// state
class State {
    constructor(state) {
        appendState(this, state);
    }
}

// 提供一个异步进程的渲染方式
export const then = function (fn) {
    setTimeout(() => {
        fn = mobx.action.bound(fn);
        fn.apply(this, arguments)
    }, 0)
}



// 绑定注入$state,$then,并设置为观察组件
export function bindState(ComponentClass) {
    if (!ComponentClass.injectMoliState) {
        class ObserverComponent extends ComponentClass {
            constructor(props, content) {
                super(props, content);
                // 私有一个State
                if (this.$state && isObject(this.$state)) {
                    this.$state = new State(this.$state)
                }
            }
        }

        // 增加了$then的方法
        ObserverComponent.prototype.$then = then

        ObserverComponent.injectMoliState = true
        return getObComponentClass(ObserverComponent)
    }

    return getObComponentClass(ComponentClass)
}