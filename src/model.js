import {observable, computed, action, autorun, extendObservable} from "mobx";
import {isUndefined, deepCopy} from  './util';
import moli from "./index";

/**
 * 构建一个模式类
 */
export default  class Model {
  constructor(model) {
    this.$origin = {};
    this.$extends = {};
    this.$index = 0;
    this.$name = '';
    this.$state = new State();
    this.$actions = new Actions();
    this.$getters = new Getters();
    this.init(model);
  }

  // 初始化
  init(model) {
    this.append(model);
    moli.append(this);//即时push到全局
  }

  // model 扩展
  append(schema) {
    this.$origin = deepCopy(schema);
    this.$extends = {};
    this.$index = 0;
    this.$name = this.$name ? this.$name : (schema.name || Math.random());
    this.$state = this.$state.appendState(schema.state);
    this.$actions = this.$actions.appendAction(schema.actions, this);
    this.$getters = this.$getters.appendGetter(schema.getter, this);
  }

  // 注入本实例
  inject() {
    return this
  }

  // 新开一个，记录继承 可以对继承者重新命名
  extendAs(name) {
    const origin = deepCopy(this.$origin);

    if (isUndefined(name)) {
      origin.name = origin.name + "/" + this.$index;
    } else {
      origin.name = origin.name + "/" + name;
    }

    this.$index++;
    const model = new Model(origin);
    this.$extends[model.$name] = model;
    return model;
  }
}


// 定义state类
class State {
  constructor() {
    this.appendState();
  }

  // 增加state
  append(name, value) {
    if (typeof name === 'undefined' || typeof value === 'undefined') {
      return this;
    }

    extendObservable(this, {
      [name]: value
    });

    return this;
  }

  appendState(state) {
    if (typeof state === 'undefined') {
      return this;
    }

    if (typeof state !== 'object') {
      console.warn('state must be a object!');
      return this;
    }

    for (let _key in state) {
      this.append(_key, state[_key])
    }

    return this;
  }
}

// actions类
class Actions {
  constructor() {

  }

  appendAction(actions, model) {
    if (typeof actions === 'undefined') {
      return this;
    }

    for (let _key in actions) {

      const _thisAction = function () {
        return actions[_key].apply(model.$state, arguments)
      };

      this[_key] = action.bound(_thisAction);
    }

    return this;
  }
}

// getters类
class Getters {
  constructor() {

  }

  appendGetter(getters, _model) {
    if (typeof getters === 'undefined') {
      return this
    }

    for (let _key in getters) {
      extendObservable(this, {
        get [_key]() {
          return getters[_key].call(_model, _model.$state)
        }
      })
    }

    return this
  }
}
