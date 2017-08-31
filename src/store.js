import { isUndefined, isObject, isArray, isString } from './utils'
import { bindState } from './state';
import { useStrict } from 'mobx';
import Model from "./model";

let namePrefix = "$"; // 预制

class Store {
  createStore(schemas) {
    if (isUndefined(schemas) || !isObject(schemas)) {
      throw Error('[moli] createStore need argument which type is a Object')
    }
    for (let key in schemas) {
      const schema = schemas[key];
      this[namePrefix + key] = new Model(schema)
    }

    return this;
  }

  getStore() {
    return this;
  }

  getModel(arg) {
    if (isString(arg) && this[namePrefix + arg]) {
      return this[namePrefix + arg]
    }
    return null
  }

  getModelProps(modelName) {
    let props = {};
    if (isUndefined(modelName)) {
      return this
    }

    if (isString(modelName)) {
      const model = this.getModel(modelName, this);
      const name = modelName;
      props[namePrefix + name] = model;
    }

    if (isArray(modelName)) {
      for (let i = 0; i < modelName.length; i++) {
        const model = this.getModel(modelName[i], this);
        const name = modelName[i];
        props[namePrefix + name] = model;
      }
    }

    return props
  }

  // 使用严格模式
  useStrict(strictMode) {
    useStrict(strictMode)
  }

  // 注入props
  injectProps(componentClass, modelName) {
    let Custom = bindState(componentClass);
    let props = this.getModelProps(modelName);

    Custom.defaultProps = Object.assign(props, Custom.defaultProps);

    return Custom;
  }
}

export const globalStore = new Store();
export const createStore = globalStore.createStore.bind(globalStore);
export const injectProps = globalStore.injectProps.bind(globalStore);