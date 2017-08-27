import React, { Component } from "react";
import { isReactClass, isUndefined } from './utils'
import { globalStore, getMobxProps } from './store'
import { bindState } from './state';

// 共享 model [ state, 还有 action => props] 为了共享；每个组件都是用的这一套
export const inject = function (arg) {
    // 如果第一个参数是component
    if (isReactClass(arg)) {
        const componentClass = arg;
        return getInjectComponent(componentClass)
    }

    return (Comp) => {
        if (Comp) {
            return getInjectComponent(Comp, arg)
        }

        return getInjectComponent(Component, arg)
    };
}

// 获取观察组件
export const getInjectComponent = function (componentClass, modelName) {
    let Custom = bindState(componentClass);

    if (isUndefined(modelName)) {
        Custom.defaultProps = Object.assign(globalStore, Custom.defaultProps);
    } else {
        Custom.defaultProps = Object.assign(getMobxProps(modelName, globalStore), Custom.defaultProps);
    }

    return Custom;
}
