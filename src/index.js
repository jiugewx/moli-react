import { observer } from "./observer";
import React, { Component } from "react";
import Model from "./model";
import { isArray, isObject, isUndefined } from './util'

const moliInjector = function (componentClass) {
  Object.defineProperty(componentClass, 'MoliInjector', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: true
  });
};

let namePrefix = "$";

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

  // 注入 model [ state, 还有 action => props] 为了共享；每个组件都是用的这一套
  inject(arg1) {
    // 如果第一个参数是component
    if (typeof arg1 === "function" && arg1.isReactClass) {
      const componentClass = arg1;
      return this._getInjectComponent(componentClass)
    }

    return (Comp) => {
      if (Comp) {
        return this._getInjectComponent(Comp, arg1)
      }

      return this._getInjectComponent(Component, arg1)
    };
  }

  // 复制 model ,复用
  copy(modelName, extendName) {
    const self = this;
    return (Comp) => {
      let Custom = this._getObserveClass(Comp);
      let originModel = self._getModel(modelName);
      originModel.$schema.name = extendName ? extendName : originModel.$schema.name;

      class MoliCopy extends Custom {
        constructor(props, content) {
          super(props, content);
          let model = new Model(originModel.$schema);
          this.state = Object.assign({},this.state);
          this.state[namePrefix + originModel.$schema.name] = model;
        }
      }

      moliInjector(MoliCopy);

      return MoliCopy
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
  _getInjectComponent(Comp, modelName) {
    let self = this;
    let Custom = this._getObserveClass(Comp);

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

export const store = globalMoli.store;
export const copy = globalMoli.copy.bind(globalMoli);
export const inject = globalMoli.inject.bind(globalMoli);
export const createModel = globalMoli.createModel.bind(globalMoli);
export const getStore = globalMoli.getStore.bind(globalMoli);
export const createStore = globalMoli.createStore.bind(globalMoli);
export default globalMoli;
