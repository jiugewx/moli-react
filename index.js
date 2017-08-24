(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('mobx'), require('react')) :
	typeof define === 'function' && define.amd ? define(['exports', 'mobx', 'react'], factory) :
	(factory((global.Moli = {}),global.mobx,global.React));
}(this, (function (exports,mobx,React) { 'use strict';

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

Observer.propTypes = {
  children: function children(propValue, key, componentName, location, propFullName) {
    if (typeof propValue[key] !== 'function') return new Error('Invalid prop `' + propFullName + '` of type `' + _typeof(propValue[key]) + '` supplied to' + ' `' + componentName + '`, expected `function`.');
  }
};

var isUndefined = function isUndefined(value) {
  return typeof value === 'undefined';
};

var isArray = function isArray(val) {
  return Object.prototype.toString.call(val) === '[object Array]';
};

var isObject = function isObject(val) {
  return !isArray(val) && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === "object";
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
 * 提取某个模式的所有state,actions
 */

var Model = function Model(schema) {
  classCallCheck(this, Model);

  this.$schema = deepCopy(schema);
  appendState(this, this.$schema.state);
  appendAction(this, this.$schema.actions);
  appendGetter(this, this.$schema.getters);
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

// 添加getters
var appendGetter = function appendGetter(_this, getters) {
  if (typeof getters === 'undefined') {
    return _this;
  }

  var _loop = function _loop(_key) {
    mobx.extendObservable(_this, defineProperty({}, _key, mobx.computed(function () {
      return getters[_key].apply(_this, arguments);
    })));
  };

  for (var _key in getters) {
    _loop(_key);
  }
};

// 添加actions
var appendAction = function appendAction(_this, actions) {
  if (typeof actions === 'undefined') {
    return _this;
  }

  var _loop2 = function _loop2(_key) {
    var _thisAction = function _thisAction() {
      return actions[_key].apply(_this, arguments);
    };

    _this[_key] = mobx.action.bound(_thisAction);
  };

  for (var _key in actions) {
    _loop2(_key);
  }
};

var moliInjector = function moliInjector(componentClass) {
  Object.defineProperty(componentClass, 'MoliInjector', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: true
  });
};

var namePrefix = "$"; // 预制

var Moli = function () {
  function Moli() {
    classCallCheck(this, Moli);

    this.store = {};
  }

  // 创建一个模式


  createClass(Moli, [{
    key: "createModel",
    value: function createModel(schema) {
      var model = new Model(schema);
      if (model instanceof Model) {
        this.store[namePrefix + schema.name] = model;
        return model;
      } else {
        throw Error('you should append a object which is Instance of Model!');
      }
    }

    // 批量创建模式

  }, {
    key: "createStore",
    value: function createStore(schemas) {
      if (isUndefined(schemas) || !isObject(schemas)) {
        return this.store;
      }
      for (var key in schemas) {
        schemas[key].name = key;
        this.store[namePrefix + key] = new Model(schemas[key]);
      }

      return this.store;
    }

    // 获取store

  }, {
    key: "getStore",
    value: function getStore() {
      return this.store;
    }

    // 共享 model [ state, 还有 action => props] 为了共享；每个组件都是用的这一套

  }, {
    key: "share",
    value: function share(arg) {
      var _this = this;

      // 如果第一个参数是component
      if (typeof arg === "function") {
        var componentClass = arg;
        return this._getInjectComponent(componentClass);
      }

      return function (Comp) {
        if (Comp) {
          return _this._getInjectComponent(Comp, arg);
        }

        return _this._getInjectComponent(React.Component, arg);
      };
    }

    // 只使用一个

  }, {
    key: "only",
    value: function only(schema) {
      var self = this;
      return function (ComponentClass) {
        if (isUndefined(schema) || !isObject(schema)) {
          return ComponentClass;
        }

        var Custom = observer(ComponentClass);

        // 组件复用的时候，都要重新走 constructor 生成一个独立的model实例

        var MoliReuse = function (_Custom) {
          inherits(MoliReuse, _Custom);

          function MoliReuse(props, content) {
            classCallCheck(this, MoliReuse);

            var _this2 = possibleConstructorReturn(this, (MoliReuse.__proto__ || Object.getPrototypeOf(MoliReuse)).call(this, props, content));

            var model = new Model(schema);
            _this2.$state = model;
            _this2.$state.props = props;
            _this2.$state.content = content;
            // 复制actions
            for (var name in model) {
              if (typeof model[name] === 'function') {
                _this2[name] = model[name];
              }
            }
            return _this2;
          }

          return MoliReuse;
        }(Custom);

        moliInjector(MoliReuse);

        return MoliReuse;
      };
    }

    // 获取model实例

  }, {
    key: "_getModel",
    value: function _getModel(arg) {
      if (arg instanceof Model) {
        return arg;
      } else if (typeof arg === 'string' && this.store[namePrefix + arg]) {
        return this.store[namePrefix + arg];
      }
      return null;
    }

    // 获取model实例 组成的{$name:model}格式

  }, {
    key: "_getMobxProps",
    value: function _getMobxProps(modelName) {
      var props = {};
      if (typeof modelName === 'string') {
        var _model = this._getModel(modelName);
        var name = _model.$schema.name;
        props[namePrefix + name] = _model;
      }

      if (isArray(modelName)) {
        for (var i = 0; i < modelName.length; i++) {
          var _model2 = this._getModel(modelName[i]);
          var _name = _model2.$schema.name;
          props[namePrefix + _name] = _model2;
        }
      }

      return props;
    }

    // 获得被观察的 ComponentClass

  }, {
    key: "_getObserveClass",
    value: function _getObserveClass(CompClass) {
      var Custom = CompClass;

      if (!CompClass['MoliInjector']) {
        Custom = observer(CompClass);
      }

      return Custom;
    }

    // 获取观察组件

  }, {
    key: "_getInjectComponent",
    value: function _getInjectComponent(CompClass, modelName) {
      var self = this;
      var Custom = this._getObserveClass(CompClass);

      if (isUndefined(modelName)) {
        Custom.defaultProps = Object.assign(self.store, Custom.defaultProps);
      } else {
        Custom.defaultProps = Object.assign(self._getMobxProps(modelName), Custom.defaultProps);
      }

      moliInjector(Custom);
      return Custom;
    }
  }]);
  return Moli;
}();

var globalMoli = new Moli();

var only = globalMoli.only.bind(globalMoli);
var share = globalMoli.share.bind(globalMoli);
var createModel = globalMoli.createModel.bind(globalMoli);
var getStore = globalMoli.getStore.bind(globalMoli);
var createStore = globalMoli.createStore.bind(globalMoli);

exports.Moli = Moli;
exports.only = only;
exports.share = share;
exports.createModel = createModel;
exports.getStore = getStore;
exports.createStore = createStore;
exports['default'] = globalMoli;

Object.defineProperty(exports, '__esModule', { value: true });

})));
