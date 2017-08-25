import { observer } from "./observer";
import React, { Component } from "react";
import { action } from "mobx";
import Model, { appendState, appendAction, appendGetter } from "./model";
import { isArray, isObject, isUndefined, deepCopy } from './util'

const moliInjector = function (componentClass) {
  Object.defineProperty(componentClass, 'MoliInjector', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: true
  });
};

let namePrefix = "$"; // 预制

export class Moli {
  constructor() {
    this.store = {};
  }

  // 创建一个模式
  createModel(schema) {
    const model = new Model(schema);
    if (model instanceof Model) {
      this.store[namePrefix + schema.name] = model;
      return model
    } else {
      throw Error('you should append a object which is Instance of Model!')
    }
  }

  // 批量创建模式
  createStore(schemas) {
    if (isUndefined(schemas) || !isObject(schemas)) {
      return this.store
    }
    for (let key in schemas) {
      schemas[key].name = key;
      this.store[namePrefix + key] = new Model(schemas[key])
    }

    return this.store
  }

  // 获取store
  getStore() {
    return this.store
  }

  // 共享 model [ state, 还有 action => props] 为了共享；每个组件都是用的这一套
  inject(arg) {
    // 如果第一个参数是component
    if (typeof arg === "function") {
      const componentClass = arg;
      return this._getInjectComponent(componentClass)
    }

    return (Comp) => {
      if (Comp) {
        return this._getInjectComponent(Comp, arg)
      }

      return this._getInjectComponent(Component, arg)
    };
  }

  // 只使用一个
  binding(schema) {
    return (ComponentClass) => {
      if (isUndefined(schema) || !isObject(schema)) {
        throw Error("this `private` function should accept a object as arguments");
      }


      const Custom = this._getObserveClass(ComponentClass);
      class Private extends Custom {
        constructor(props, content) {
          super(props, content);
          // 私有一个State
          class State {
            constructor(schema) {
              appendState(this, schema.state);
              appendGetter(this, schema.getters);
              appendAction(State.prototype, this, schema.actions);
            }
          }
          this.$state = new State(schema);
          this.$state = Object.assign(this.$state, this);
        }
      }

      const actions = schema.actions;
      for (let _key in actions) {
        const _thisAction = function () {
          return actions[_key].apply(this.$state, arguments)
        };
        Private.prototype[_key] = action.bound(_thisAction);
      }

      moliInjector(Private);

      return Private
    };
  }

  // 获取model实例
  _getModel(arg) {
    if (arg instanceof Model) {
      return arg;
    } else if (typeof arg === 'string' && this.store[namePrefix + arg]) {
      return this.store[namePrefix + arg]
    }
    return null
  }

  // 获取model实例 组成的{$name:model}格式
  _getMobxProps(modelName) {
    let props = {};
    if (typeof modelName === 'string') {
      const model = this._getModel(modelName);
      const name = model.$schema.name;
      props[namePrefix + name] = model;
    }

    if (isArray(modelName)) {
      for (let i = 0; i < modelName.length; i++) {
        const model = this._getModel(modelName[i]);
        const name = model.$schema.name;
        props[namePrefix + name] = model;
      }
    }

    return props
  }

  // 获得被观察的 ComponentClass
  _getObserveClass(CompClass) {
    let Custom = CompClass;

    if (!CompClass['MoliInjector']) {
      Custom = observer(CompClass);
    }

    return Custom
  }

  // 获取观察组件
  _getInjectComponent(CompClass, modelName) {
    let self = this;
    let Custom = this._getObserveClass(CompClass);

    if (isUndefined(modelName)) {
      Custom.defaultProps = Object.assign(self.store, Custom.defaultProps);
    } else {
      Custom.defaultProps = Object.assign(self._getMobxProps(modelName), Custom.defaultProps);
    }

    moliInjector(Custom);
    return Custom;
  }
}

const globalMoli = new Moli();

export const binding = globalMoli.binding.bind(globalMoli);
export const inject = globalMoli.inject.bind(globalMoli);
export const createModel = globalMoli.createModel.bind(globalMoli);
export const getStore = globalMoli.getStore.bind(globalMoli);
export const createStore = globalMoli.createStore.bind(globalMoli);
export default globalMoli;
