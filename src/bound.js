import React, { Component } from "react";
import { isArray, isObject, isUndefined, isFunction, deepCopy, isReactClass } from './utils'
import { observer, getObComponentClass } from "./observer";
import { appendState, appendAction, appendGetter } from "./model";
import { bindState } from './state';
import * as mobx from "mobx";

// 只使用一个
export const bound = function (schema) {
    // 如果第一个参数是component
    if (isReactClass(schema)) {
        const componentClass = schema;
        return bindState(componentClass);
    }

    if (isUndefined(schema) || !isObject(schema)) {
        throw Error("this `bound` function should accept a object or a React.Component as arguments");
    }


    return (componentClass) => {
        const Custom = bindState(componentClass);
        class BoundComponent extends Custom {
            constructor(props, content) {
                super(props, content);
                // 私有一个State
                class State {
                    constructor(schema) {
                        appendState(this, schema.state);
                        appendGetter(this, this, schema.computed);
                        appendAction(State.prototype, this, schema);
                    }
                }
                this.$state = Object.assign(new State(schema), this);
            }
        }

        for (let _key in schema) {
            if (isFunction(schema[_key])) {
                const _thisAction = function () {
                    return schema[_key].apply(this.$state, arguments)
                };
                Object.defineProperty(Custom.prototype, _key, {
                    enumerable: false,
                    value: mobx.action.bound(_thisAction),
                    writable: false,
                    configurable: false,
                })
            }
        }

        return BoundComponent
    };
}

bound.action = mobx.action.bound;