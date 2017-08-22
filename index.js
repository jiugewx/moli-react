(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('mobx'), require('react')) :
	typeof define === 'function' && define.amd ? define(['exports', 'mobx', 'react'], factory) :
	(factory((global.Moli = {}),global.mobx,global.React));
}(this, (function (exports,mobx,React) { 'use strict';

var React__default = 'default' in React ? React['default'] : React;

/**
 * observer.js部分参考了mobx-react的observer
 */
let isUsingStaticRendering = false;

/**
 * mergeReactLifeHook将react钩子与mixin合并，并提供是否先运行mixin里的方法
 * @param target
 * @param funcName
 * @param runMixinFirst
 */
function mergeReactLifeHook(target, funcName, runMixinFirst = false) {
  const base = target[funcName];
  const mixinFunc = reactiveMixin[funcName];
  const f = !base
      ? mixinFunc
      : runMixinFirst === true
        ? function () {
          mixinFunc.apply(this, arguments);
          base.apply(this, arguments);
        }
        : function () {
          base.apply(this, arguments);
          mixinFunc.apply(this, arguments);
        };

  target[funcName] = f;
}

/**
 * isObjectShallowModified 检测对象是否发生了变化
 * @param prev
 * @param next
 * @returns {boolean}
 */
function isObjectShallowModified(prev, next) {
  if (null == prev || null == next || typeof prev !== "object" || typeof next !== "object") {
    return prev !== next;
  }
  const keys = Object.keys(prev);
  if (keys.length !== Object.keys(next).length) {
    return true;
  }
  let key;
  for (let i = keys.length - 1; i >= 0, key = keys[i]; i--) {
    if (next[key] !== prev[key]) {
      return true;
    }
  }
  return false;
}

/**
 * ReactiveMixin 构建一个reactive的混合
 * @type {{componentWillMount: reactiveMixin.componentWillMount, componentWillUnmount: reactiveMixin.componentWillUnmount, componentDidMount: reactiveMixin.componentDidMount, componentDidUpdate: reactiveMixin.componentDidUpdate, shouldComponentUpdate: reactiveMixin.shouldComponentUpdate}}
 */
const reactiveMixin = {
  // 这个钩子里改造了render函数
  componentWillMount: function () {
    if (isUsingStaticRendering === true)
      return;
    // 为调试生成比较友好的name
    const initialName = this.displayName
      || this.name
      || (this.constructor && (this.constructor.displayName || this.constructor.name))
      || "<component>";
    // this._reactInternalInstance是ReactCompositeComponent的实例
    const rootNodeID = this._reactInternalInstance && this._reactInternalInstance._rootNodeID;

    // 如果props发生了变化，react也要render；所以 atom.reportChanged() 不应该影响到re-render
    let skipRender = false;
    // forceUpdate 将会重新合并 this.props,我们不想引起这个轮询，所以检查这个变化
    let isForcingUpdate = false;

    // 让观察属性保持引用
    function makePropertyObservableReference(propName) {
      let valueHolder = this[propName];
      const atom = new mobx.Atom("reactive " + propName);
      Object.defineProperty(this, propName, {
        configurable: true, enumerable: true,
        get: function () {
          atom.reportObserved();
          return valueHolder;
        },
        set: function set(v) {
          if (!isForcingUpdate && isObjectShallowModified(valueHolder, v)) {
            valueHolder = v;
            skipRender = true;
            atom.reportChanged();
            skipRender = false;
          } else {
            valueHolder = v;
          }
        }
      });
    }

    // make this.props an observable reference, see #124
    makePropertyObservableReference.call(this, "props");
    // make state an observable reference
    makePropertyObservableReference.call(this, "state");

    // 连接 reactive render
    const baseRender = this.render.bind(this);
    let reaction = null;
    let isRenderingPending = false;

    // 初始化render
    const initialRender = () => {
      reaction = new mobx.Reaction(`${initialName}#${rootNodeID}.render()`, () => {
        if (!isRenderingPending) {
          // N.B. Getting here *before mounting* means that a component constructor has side effects (see the relevant test in misc.js)
          // This unidiomatic React usage but React will correctly warn about this so we continue as usual
          // See #85 / Pull #44
          isRenderingPending = true;
          if (typeof this.componentWillReact === "function")
            this.componentWillReact(); // TODO: wrap in action?
          if (this.__$mobxIsUnmounted !== true) {
            // If we are unmounted at this point, componentWillReact() had a side effect causing the component to unmounted
            // TODO: remove this check? Then react will properly warn about the fact that this should not happen? See #73
            // However, people also claim this migth happen during unit tests..
            let hasError = true;
            try {
              isForcingUpdate = true;
              if (!skipRender)
                React__default.Component.prototype.forceUpdate.call(this);
              hasError = false;
            } finally {
              isForcingUpdate = false;
              if (hasError)
                reaction.dispose();
            }
          }
        }
      });
      reactiveRender.$mobx = reaction;
      this.render = reactiveRender;
      return reactiveRender();
    };

    const reactiveRender = () => {
      isRenderingPending = false;
      let rendering = undefined;
      reaction.track(() => {
        try {
          rendering = mobx.extras.allowStateChanges(false, baseRender);
        } catch (error) {
          throw error;
        }
      });

      return rendering;
    };

    this.render = initialRender;
  },

  componentWillUnmount: function () {
    if (isUsingStaticRendering === true)
      return;
    this.render.$mobx && this.render.$mobx.dispose();
    this.__$mobxIsUnmounted = true;
  },

  componentDidMount: function () {
  },

  componentDidUpdate: function () {
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    if (isUsingStaticRendering) {
      console.warn("[mobx-react] It seems that a re-rendering of a React component is triggered while in static (server-side) mode. Please make sure components are rendered only once server-side.");
    }
    // state发生变化也要更新组件
    if (this.state !== nextState) {
      return true;
    }
    // PureRenderMixin
    // we could return just 'false' here, and avoid the `skipRender` checks etc
    // however, it is nicer if lifecycle events are triggered like usually,
    // so we return true here if props are shallowly modified.
    return isObjectShallowModified(this.props, nextProps);
  }
};

/**
 * Observer function / decorator
 * @param arg1
 * @returns {*}
 */
function observer(arg1) {
  const componentClass = arg1;

  if (
    typeof componentClass === "function" &&
    (!componentClass.prototype || !componentClass.prototype.render) && !componentClass.isReactClass && !React__default.Component.isPrototypeOf(componentClass)
  ) {

    class Index extends React.Component {
      render() {
        return componentClass.call(this, this.props, this.context);
      }
    }

    Index.displayName = componentClass.displayName || componentClass.name;
    Index.contextTypes = componentClass.contextTypes;
    Index.propTypes = componentClass.propTypes;
    Index.defaultProps = componentClass.defaultProps;

    return observer(Index);
  }

  if (!componentClass) {
    throw new Error("Please pass a valid component to 'observer'");
  }

  const target = componentClass.prototype || componentClass;
  mixinLifecycleEvents(target);
  componentClass.isMobXReactObserver = true;
  return componentClass;
}

/**
 * mixinLifecycleEvents mixin的生命周期
 * @param target
 */
function mixinLifecycleEvents(target) {
  mergeReactLifeHook(target, "componentWillMount", true);
  [
    "componentDidMount",
    "componentWillUnmount",
    "componentDidUpdate"
  ].forEach(function (funcName) {
    mergeReactLifeHook(target, funcName);
  });
  if (!target.shouldComponentUpdate) {
    target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate;
  }
}

const Observer = observer(({children}) => children());

Observer.propTypes = {
  children: (propValue, key, componentName, location, propFullName) => {
    if (typeof propValue[key] !== 'function')
      return new Error(
        'Invalid prop `' + propFullName + '` of type `' + typeof propValue[key] + '` supplied to' +
        ' `' + componentName + '`, expected `function`.'
      );
  }
};

const isUndefined = function (value) {
  return typeof value === 'undefined';
};

const isArray = function (val) {
  return Object.prototype.toString.call(val) === '[object Array]';
};

const isObject = function (val) {
  return !isArray(val) && (typeof val === "object");
};

const deepCopy = function (object) {
  let newObject = null;
  if (isArray(object)) {
    newObject = [];
    for (let i = 0; i < object.length; i++) {
      newObject.push(deepCopy(object[i]));
    }
  } else if (isObject(object)) {
    newObject = {};
    for (let k in object) {
      newObject[k] = deepCopy(object[k]);
    }
  } else {
    newObject = object;
  }
  return newObject;
};

/**
 * 提取某个模式的所有state,actions
 */
class Model {
  constructor(schema) {
    this.$origin = deepCopy(schema);
    this.$name = this.$name ? this.$name : (schema.name || Math.random());
    this.appendState(schema.state);
    this.appendAction(this, schema.actions);
    this.appendGetter(this, schema.getters);
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
      mobx.extendObservable(this, {
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
      mobx.extendObservable(this, {
        [_key]: mobx.computed(function () {
          return getters[_key].apply(_this, arguments)
        })
      });
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

      this[_key] = mobx.action.bound(_thisAction);
    }
  }
}

class Moli {
  constructor() {
    this.$store = {};
  }

  // 创建一个模式
  createModel(schema) {
    const model = new Model(schema);
    if (model instanceof Model) {
      const name = model.$name;
      this.$store[name] = model;
      return model
    } else {
      throw Error('you should append a object which is Instance of Model!')
    }
  }

  // 批量创建模式
  createStore(schemas) {
    if (isUndefined(schemas) || !isObject(schemas)) {
      return this.$store
    }
    for (let key in schemas) {
      schemas[key].name = key;
      this.$store[key] = new Model(schemas[key]);
    }

    return this.$store
  }

  // 获取store
  getStore() {
    return this.$store
  }

  // 注入 model [ state, 还有 action => props] 为了共享；每个组件都是用的这一套
  inject(modelName) {
    return (Comp) => {
      if (Comp) {
        return this._getInjectComponent(modelName, Comp)
      }

      return this._getInjectComponent(modelName, React.Component)
    };
  }

  // 复制 model ,复用
  copy(modelName, extendName) {
    const self = this;
    return (Comp) => {
      class Index extends React.Component {
        render() {
          let model = self._getModel(extendName);// 查找是否存在
          if (!model) {
            let originModel = self._getModel(modelName);
            originModel.$origin.name = extendName ? extendName : originModel.$origin.name;
            model = new Model(originModel.$origin);
          }
          let props = {};
          props['$' + model.$name] = model;
          const Custom = observer(Comp);
          props = Object.assign(props, this.props);
          return React__default.createElement(Custom, props);
        }
      }
      return Index
    };
  }

  // 获取model实例
  _getModel(arg) {
    if (arg instanceof Model) {
      return arg;
    } else if (typeof arg === 'string' && this.$store[arg]) {
      return this.$store[arg]
    }
    return null
  }

  // 获取model实例 组成的{$name:model}格式
  _getMobxProps(modelName) {
    let props = {};
    if (typeof modelName === 'string') {
      const model = this._getModel(modelName);
      props['$' + model.$name] = model;
    }

    if (isArray(modelName)) {
      for (let i = 0; i < modelName.length; i++) {
        const model = this._getModel(modelName[i]);
        props['$' + model.$name] = model;
      }
    }

    return props
  }

  // 获取观察组件
  _getInjectComponent(modelName, Comp) {
    const self = this;
    return class Index extends React.Component {
      render() {
        let props = self._getMobxProps(modelName);
        const Custom = observer(Comp);
        props = Object.assign(props, this.props);
        return React__default.createElement(Custom, props);
      }
    }
  }
}

const globalMoli = new Moli();

const copy = globalMoli.copy.bind(globalMoli);
const inject = globalMoli.inject.bind(globalMoli);
const createModel = globalMoli.createModel.bind(globalMoli);
const getStore = globalMoli.getStore.bind(globalMoli);
const createStore = globalMoli.createStore.bind(globalMoli);

exports.Moli = Moli;
exports.copy = copy;
exports.inject = inject;
exports.createModel = createModel;
exports.getStore = getStore;
exports.createStore = createStore;
exports['default'] = globalMoli;

Object.defineProperty(exports, '__esModule', { value: true });

})));
