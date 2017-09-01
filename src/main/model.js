import { computed, action, extendObservable } from "mobx";
import { deepCopy, isObject, isUndefined, isFunction, Enumerable } from '../utils';

/**
 * 提取某个模式的所有state,actions
 */
export default class Model {
  constructor(schema) {
    if (!isObject(schema)) {
      throw Error('[moli] Model need argument which type is a Object')
    }
    Enumerable(this, "$schema", deepCopy(schema))
    appendState(this, this.$schema.state);
    appendGetter(this, this, this.$schema.computed);
    appendAction(this, this, this.$schema);
  }
}


// 添加state
export const appendState = function (_this, state) {
  if (typeof state === 'undefined') {
    return _this;
  }

  if (typeof state !== 'object') {
    console.warn('state must be a object!');
    return _this;
  }

  for (let _key in state) {
    extendObservable(_this, {
      [_key]: state[_key]
    });
  }
};

// 添加compute
export const appendGetter = function (object, context, computeds) {
  if (isUndefined(computeds)) {
    return object
  }

  for (let _key in computeds) {
    extendObservable(object, {
      [_key]: computed(function () {
        return computeds[_key].apply(context, arguments)
      })
    })
  }
};

// 添加actions
export const appendAction = function (object, context, schema) {
  if (isUndefined(schema)) {
    return object;
  }

  for (let _key in schema) {
    const pro = schema[_key];
    if (isFunction(pro)) {
      const _thisAction = function () {
        return pro.apply(context, arguments)
      };
      Enumerable(object, _key, action.bound(_thisAction))
    }
  }
};
