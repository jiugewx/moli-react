import React, { Component } from "react";
import { isObject, isUndefined, isFunction, isReactClass, Enumerable } from './utils'
import { appendState, appendAction, appendGetter } from "./model";
import { bindState, then } from './state';
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

                Enumerable(State.prototype, "$then", then)

                this.$state = Object.assign(new State(schema), this);
            }
        }

        for (let _key in schema) {
            if (isFunction(schema[_key])) {
                const _thisAction = function () {
                    return schema[_key].apply(this.$state, arguments)
                };
                Enumerable(Custom.prototype, _key, mobx.action.bound(_thisAction))
            }
        }

        return BoundComponent
    };
}

bound.action = mobx.action.bound;