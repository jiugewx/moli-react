import React, { Component } from "react";
import { isReactClass } from './utils'
import { injectProps } from './store'

// 共享 model [ state, 还有 action => props] 为了共享；每个组件都是用的这一套
export const inject = function (arg) {
    // 如果第一个参数是component
    if (isReactClass(arg)) {
        const componentClass = arg;
        return injectProps(componentClass)
    }

    return (Comp) => {
        if (Comp) {
            return injectProps(Comp, arg)
        }

        return injectProps(Component, arg)
    };
}

