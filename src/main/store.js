import { isUndefined, isObject, isArray, isString } from '../utils'
import { bindState } from './state';
import Model from "./model";

let namePrefix = "$"; // 预制
let mounted = false;//已经加载

export default class Store {
  createStore(schemas) {
    if (isUndefined(schemas) || !isObject(schemas)) {
      throw Error('[moli] createStore need argument which type is a Object')
    }

    const keys = Object.keys(schemas);
    if (keys.length == 0) {
      return this;
    }

    keys.map(key => {
      const schema = schemas[key];
      this[namePrefix + key] = new Model(schema)
    });

    mounted = true;
    return this;
  }

  get mounted() {
    return mounted;
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
      for ( let i = 0; i < modelName.length; i++ ) {
        const model = this.getModel(modelName[i], this);
        const name = modelName[i];
        props[namePrefix + name] = model;
      }
    }

    return props
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
export const injectProps = globalStore.injectProps.bind(globalStore);