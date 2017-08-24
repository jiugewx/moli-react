import {computed, action, extendObservable} from "mobx";
import {deepCopy} from  './util';

/**
 * 提取某个模式的所有state,actions
 */
export default class Model {
  constructor(schema) {
    this.$schema = deepCopy(schema);
    this.appendState(this.$schema.state);
    this.appendAction(this, this.$schema.actions);
    this.appendGetter(this, this.$schema.getters);
  }

  // 添加state
  appendState(state) {
    if (typeof state === 'undefined') {
      return this;
    }

    if (typeof state !== 'object') {
      console.warn('state must be a object!');
      return this;
    }

    for (let _key in state) {
      extendObservable(this, {
        [_key]: state[_key]
      });
    }
  }

  // 添加getters
  appendGetter(_this, getters) {
    if (typeof getters === 'undefined') {
      return this
    }

    for (let _key in getters) {
      extendObservable(this, {
        [_key]: computed(function () {
          return getters[_key].apply(_this, arguments)
        })
      })
    }
  }

  // 添加actions
  appendAction(_this, actions) {
    if (typeof actions === 'undefined') {
      return this;
    }

    for (let _key in actions) {
      const _thisAction = function () {
        return actions[_key].apply(_this, arguments)
      };

      this[_key] = action.bound(_thisAction);
    }
  }
}