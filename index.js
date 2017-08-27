(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('mobx')) :
	typeof define === 'function' && define.amd ? define(['exports', 'react', 'mobx'], factory) :
	(factory((global.Moli = {}),global.React,global.mobx));
}(this, (function (exports,React,mobx) { 'use strict';

var React__default = 'default' in React ? React['default'] : React;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};



var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var isUndefined = function isUndefined(value) {
  return typeof value === 'undefined';
};

var isFunction = function isFunction(value) {
  return typeof value === 'function';
};

var isString = function isString(value) {
  return typeof value === 'string';
};

var isArray = function isArray(val) {
  return Object.prototype.toString.call(val) === '[object Array]';
};

var isObject = function isObject(val) {
  return !isArray(val) && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === "object";
};

var isReactClass = function isReactClass(componentClass) {
  return isFunction(componentClass) && componentClass.prototype && !!componentClass.prototype.render && !!componentClass.prototype.setState && !!componentClass.prototype.forceUpdate;
};

var deepCopy = function deepCopy(object) {
  var newObject = null;
  if (isArray(object)) {
    newObject = [];
    for (var i = 0; i < object.length; i++) {
      newObject.push(deepCopy(object[i]));
    }
  } else if (isObject(object)) {
    newObject = {};
    for (var k in object) {
      newObject[k] = deepCopy(object[k]);
    }
  } else {
    newObject = object;
  }
  return newObject;
};

/**
 * observer.js部分参考了mobx-react的observer
 */
var isUsingStaticRendering = false;

/**
 * mergeReactLifeHook将react钩子与mixin合并，并提供是否先运行mixin里的方法
 * @param target
 * @param funcName
 * @param runMixinFirst
 */
function mergeReactLifeHook(target, funcName) {
  var runMixinFirst = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var base = target[funcName];
  var mixinFunc = reactiveMixin[funcName];
  var f = !base ? mixinFunc : runMixinFirst === true ? function () {
    mixinFunc.apply(this, arguments);
    base.apply(this, arguments);
  } : function () {
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
  if (null == prev || null == next || (typeof prev === 'undefined' ? 'undefined' : _typeof(prev)) !== "object" || (typeof next === 'undefined' ? 'undefined' : _typeof(next)) !== "object") {
    return prev !== next;
  }
  var keys = Object.keys(prev);
  if (keys.length !== Object.keys(next).length) {
    return true;
  }
  var key = void 0;
  for (var i = keys.length - 1; i >= 0, key = keys[i]; i--) {
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
var reactiveMixin = {
  // 这个钩子里改造了render函数
  componentWillMount: function componentWillMount() {
    var _this = this;

    if (isUsingStaticRendering === true) return;
    // 为调试生成比较友好的name
    var initialName = this.displayName || this.name || this.constructor && (this.constructor.displayName || this.constructor.name) || "<component>";
    // this._reactInternalInstance是ReactCompositeComponent的实例
    var rootNodeID = this._reactInternalInstance && this._reactInternalInstance._rootNodeID;

    // 如果props发生了变化，react也要render；所以 atom.reportChanged() 不应该影响到re-render
    var skipRender = false;
    // forceUpdate 将会重新合并 this.props,我们不想引起这个轮询，所以检查这个变化
    var isForcingUpdate = false;

    // 让观察属性保持引用
    function makePropertyObservableReference(propName) {
      var valueHolder = this[propName];
      var atom = new mobx.Atom("reactive " + propName);
      Object.defineProperty(this, propName, {
        configurable: true, enumerable: true,
        get: function get$$1() {
          atom.reportObserved();
          return valueHolder;
        },
        set: function set$$1(v) {
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
    var baseRender = this.render.bind(this);
    var reaction = null;
    var isRenderingPending = false;

    // 初始化render
    var initialRender = function initialRender() {
      reaction = new mobx.Reaction(initialName + '#' + rootNodeID + '.render()', function () {
        if (!isRenderingPending) {
          // N.B. Getting here *before mounting* means that a component constructor has side effects (see the relevant test in misc.js)
          // This unidiomatic React usage but React will correctly warn about this so we continue as usual
          // See #85 / Pull #44
          isRenderingPending = true;
          if (typeof _this.componentWillReact === "function") _this.componentWillReact(); // TODO: wrap in action?
          if (_this.__$mobxIsUnmounted !== true) {
            // If we are unmounted at this point, componentWillReact() had a side effect causing the component to unmounted
            // TODO: remove this check? Then react will properly warn about the fact that this should not happen? See #73
            // However, people also claim this migth happen during unit tests..
            var hasError = true;
            try {
              isForcingUpdate = true;
              if (!skipRender) React__default.Component.prototype.forceUpdate.call(_this);
              hasError = false;
            } finally {
              isForcingUpdate = false;
              if (hasError) reaction.dispose();
            }
          }
        }
      });
      reactiveRender.$mobx = reaction;
      _this.render = reactiveRender;
      return reactiveRender();
    };

    var reactiveRender = function reactiveRender() {
      isRenderingPending = false;
      var rendering = undefined;
      reaction.track(function () {
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

  componentWillUnmount: function componentWillUnmount() {
    if (isUsingStaticRendering === true) return;
    this.render.$mobx && this.render.$mobx.dispose();
    this.__$mobxIsUnmounted = true;
  },

  componentDidMount: function componentDidMount() {},

  componentDidUpdate: function componentDidUpdate() {},

  shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
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
  var componentClass = arg1;

  if (typeof componentClass === "function" && (!componentClass.prototype || !componentClass.prototype.render) && !componentClass.isReactClass && !React__default.Component.isPrototypeOf(componentClass)) {
    var ObserverClass = function (_Component) {
      inherits(ObserverClass, _Component);

      function ObserverClass() {
        classCallCheck(this, ObserverClass);
        return possibleConstructorReturn(this, (ObserverClass.__proto__ || Object.getPrototypeOf(ObserverClass)).apply(this, arguments));
      }

      createClass(ObserverClass, [{
        key: 'render',
        value: function render() {
          return componentClass.call(this, this.props, this.context);
        }
      }]);
      return ObserverClass;
    }(React.Component);

    ObserverClass.displayName = componentClass.displayName || componentClass.name;
    ObserverClass.contextTypes = componentClass.contextTypes;
    ObserverClass.propTypes = componentClass.propTypes;
    ObserverClass.defaultProps = componentClass.defaultProps;

    return observer(ObserverClass);
  }

  if (!componentClass) {
    throw new Error("Please pass a valid component to 'observer'");
  }

  var target = componentClass.prototype || componentClass;
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
  ["componentDidMount", "componentWillUnmount", "componentDidUpdate"].forEach(function (funcName) {
    mergeReactLifeHook(target, funcName);
  });
  if (!target.shouldComponentUpdate) {
    target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate;
  }
}

var Observer = observer(function (_ref) {
  var children = _ref.children;
  return children();
});

// 获得被观察的 getObComponentClass
var getObComponentClass = function getObComponentClass(componentClass) {
  var Custom = componentClass;

  if (!componentClass['isMobXReactObserver']) {
    Custom = observer(componentClass);
  }

  return Custom;
};

Observer.propTypes = {
  children: function children(propValue, key, componentName, location, propFullName) {
    if (typeof propValue[key] !== 'function') return new Error('Invalid prop `' + propFullName + '` of type `' + _typeof(propValue[key]) + '` supplied to' + ' `' + componentName + '`, expected `function`.');
  }
};

/**
 * 提取某个模式的所有state,actions
 */

var Model = function Model(schema) {
  classCallCheck(this, Model);

  if (!isObject(schema)) {
    throw Error('[moli] Model need argument which type is a Object');
  }
  Object.defineProperty(this, "$schema", {
    configurable: true,
    enumerable: true,
    writable: false,
    value: deepCopy(schema)
  });
  appendState(this, this.$schema.state);
  appendGetter(this, this, this.$schema.computed);
  appendAction(this, this, this.$schema);
};

var appendState = function appendState(_this, state) {
  if (typeof state === 'undefined') {
    return _this;
  }

  if ((typeof state === 'undefined' ? 'undefined' : _typeof(state)) !== 'object') {
    console.warn('state must be a object!');
    return _this;
  }

  for (var _key in state) {
    mobx.extendObservable(_this, defineProperty({}, _key, state[_key]));
  }
};

// 添加compute
var appendGetter = function appendGetter(object, context, computeds) {
  if (isUndefined(computeds)) {
    return object;
  }

  var _loop = function _loop(_key) {
    mobx.extendObservable(object, defineProperty({}, _key, mobx.computed(function () {
      return computeds[_key].apply(context, arguments);
    })));
  };

  for (var _key in computeds) {
    _loop(_key);
  }
};

// 添加actions
var appendAction = function appendAction(object, context, schema) {
  if (isUndefined(schema)) {
    return object;
  }

  var _loop2 = function _loop2(_key) {
    var pro = schema[_key];
    if (isFunction(pro)) {
      var _thisAction = function _thisAction() {
        return pro.apply(context, arguments);
      };
      Object.defineProperty(object, _key, {
        enumerable: false,
        value: mobx.action.bound(_thisAction),
        writable: false,
        configurable: true
      });
    }
  };

  for (var _key in schema) {
    _loop2(_key);
  }
};

// state

var State = function State(state) {
    classCallCheck(this, State);

    appendState(this, state);
};

// 提供一个异步进程的渲染方式


var then = function then(fn) {
    var _this = this,
        _arguments = arguments;

    setTimeout(function () {
        fn = mobx.action.bound(fn);
        fn.apply(_this, _arguments);
    }, 0);
};

// 绑定注入$state,$then,并设置为观察组件
function bindState(ComponentClass) {
    if (!ComponentClass.injectMoliState) {
        var ObserverComponent = function (_ComponentClass) {
            inherits(ObserverComponent, _ComponentClass);

            function ObserverComponent(props, content) {
                classCallCheck(this, ObserverComponent);

                // 私有一个State
                var _this2 = possibleConstructorReturn(this, (ObserverComponent.__proto__ || Object.getPrototypeOf(ObserverComponent)).call(this, props, content));

                if (_this2.$state && isObject(_this2.$state)) {
                    _this2.$state = new State(_this2.$state);
                }
                return _this2;
            }

            return ObserverComponent;
        }(ComponentClass);

        // 增加了$then的方法


        ObserverComponent.prototype.$then = then;

        ObserverComponent.injectMoliState = true;
        return getObComponentClass(ObserverComponent);
    }

    return getObComponentClass(ComponentClass);
}

// 只使用一个
var bound = function bound(schema) {
    // 如果第一个参数是component
    if (isReactClass(schema)) {
        var componentClass = schema;
        return bindState(componentClass);
    }

    if (isUndefined(schema) || !isObject(schema)) {
        throw Error("this `bound` function should accept a object or a React.Component as arguments");
    }

    return function (componentClass) {
        var Custom = bindState(componentClass);

        var BoundComponent = function (_Custom) {
            inherits(BoundComponent, _Custom);

            function BoundComponent(props, content) {
                classCallCheck(this, BoundComponent);

                // 私有一个State
                var _this = possibleConstructorReturn(this, (BoundComponent.__proto__ || Object.getPrototypeOf(BoundComponent)).call(this, props, content));

                var State = function State(schema) {
                    classCallCheck(this, State);

                    appendState(this, schema.state);
                    appendGetter(this, this, schema.computed);
                    appendAction(State.prototype, this, schema);
                };

                _this.$state = Object.assign(new State(schema), _this);
                return _this;
            }

            return BoundComponent;
        }(Custom);

        var _loop = function _loop(_key) {
            if (isFunction(schema[_key])) {
                var _thisAction = function _thisAction() {
                    return schema[_key].apply(this.$state, arguments);
                };
                Object.defineProperty(Custom.prototype, _key, {
                    enumerable: false,
                    value: mobx.action.bound(_thisAction),
                    writable: false,
                    configurable: false
                });
            }
        };

        for (var _key in schema) {
            _loop(_key);
        }

        return BoundComponent;
    };
};

bound.action = mobx.action.bound;

var namePrefix = "$"; // 预制
var globalStore = {};

var createStore = function createStore(schemas) {
    if (isUndefined(schemas) || !isObject(schemas)) {
        throw Error('[moli] createStore need argument which type is a Object');
    }
    for (var key in schemas) {
        var schema = schemas[key];
        globalStore[namePrefix + key] = new Model(schema);
    }

    return globalStore;
};

// 获取model实例
function getModel(arg, store) {
    if (isString(arg) && store[namePrefix + arg]) {
        return store[namePrefix + arg];
    }
    return null;
}

function getMobxProps(modelName, store) {
    var props = {};
    if (isString(modelName)) {
        var model = getModel(modelName, store);
        var name = modelName;
        props[namePrefix + name] = model;
    }

    if (isArray(modelName)) {
        for (var i = 0; i < modelName.length; i++) {
            var _model = getModel(modelName[i], store);
            var _name = modelName[i];
            props[namePrefix + _name] = _model;
        }
    }

    return props;
}

// 共享 model [ state, 还有 action => props] 为了共享；每个组件都是用的这一套
var inject = function inject(arg) {
    // 如果第一个参数是component
    if (isReactClass(arg)) {
        var componentClass = arg;
        return getInjectComponent(componentClass);
    }

    return function (Comp) {
        if (Comp) {
            return getInjectComponent(Comp, arg);
        }

        return getInjectComponent(React.Component, arg);
    };
};

// 获取观察组件
var getInjectComponent = function getInjectComponent(componentClass, modelName) {
    var Custom = bindState(componentClass);

    if (isUndefined(modelName)) {
        Custom.defaultProps = Object.assign(globalStore, Custom.defaultProps);
    } else {
        Custom.defaultProps = Object.assign(getMobxProps(modelName, globalStore), Custom.defaultProps);
    }

    return Custom;
};

exports.bound = bound;
exports.inject = inject;
exports.createStore = createStore;
exports.observer = observer;
exports.then = then;
exports.useStrict = mobx.useStrict;

Object.defineProperty(exports, '__esModule', { value: true });

})));
