/* author:xizhi */
!function(global, factory) {
    "object" == typeof exports && "undefined" != typeof module ? factory(exports, require("react"), require("mobx")) : "function" == typeof define && define.amd ? define([ "exports", "react", "mobx" ], factory) : factory(global.Moli = {}, global.React, global.mobx);
}(this, function(exports, React, mobx) {
    "use strict";
    function mergeReactLifeHook(target, funcName) {
        var runMixinFirst = arguments.length > 2 && arguments[2] !== undefined && arguments[2], base = target[funcName], mixinFunc = reactiveMixin[funcName], f = base ? !0 === runMixinFirst ? function() {
            mixinFunc.apply(this, arguments), base.apply(this, arguments);
        } : function() {
            base.apply(this, arguments), mixinFunc.apply(this, arguments);
        } : mixinFunc;
        target[funcName] = f;
    }
    function isObjectShallowModified(prev, next) {
        if (null == prev || null == next || "object" !== (void 0 === prev ? "undefined" : _typeof(prev)) || "object" !== (void 0 === next ? "undefined" : _typeof(next))) return prev !== next;
        var keys = Object.keys(prev);
        if (keys.length !== Object.keys(next).length) return !0;
        for (var key = void 0, i = keys.length - 1; key = keys[i]; i--) if (next[key] !== prev[key]) return !0;
        return !1;
    }
    function observer(arg1) {
        var componentClass = arg1;
        if (!("function" != typeof componentClass || componentClass.prototype && componentClass.prototype.render || componentClass.isReactClass || React__default.Component.isPrototypeOf(componentClass))) {
            var ObserverClass = function(_Component) {
                function ObserverClass() {
                    return classCallCheck(this, ObserverClass), possibleConstructorReturn(this, (ObserverClass.__proto__ || Object.getPrototypeOf(ObserverClass)).apply(this, arguments));
                }
                return inherits(ObserverClass, _Component), createClass(ObserverClass, [ {
                    key: "render",
                    value: function() {
                        return componentClass.call(this, this.props, this.context);
                    }
                } ]), ObserverClass;
            }(React.Component);
            return ObserverClass.displayName = componentClass.displayName || componentClass.name, 
            ObserverClass.contextTypes = componentClass.contextTypes, ObserverClass.propTypes = componentClass.propTypes, 
            ObserverClass.defaultProps = componentClass.defaultProps, observer(ObserverClass);
        }
        if (!componentClass) throw new Error("Please pass a valid component to 'observer'");
        return mixinLifecycleEvents(componentClass.prototype || componentClass), componentClass.isMobXReactObserver = !0, 
        componentClass;
    }
    function mixinLifecycleEvents(target) {
        mergeReactLifeHook(target, "componentWillMount", !0), [ "componentDidMount", "componentWillUnmount", "componentDidUpdate" ].forEach(function(funcName) {
            mergeReactLifeHook(target, funcName);
        }), target.shouldComponentUpdate || (target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate);
    }
    function isNative(Ctor) {
        return /native code/.test(Ctor.toString());
    }
    function bindState(ComponentClass) {
        if (!ComponentClass.injectMoliState) {
            var ObserverComponent = function(_ComponentClass) {
                function ObserverComponent(props, content) {
                    classCallCheck(this, ObserverComponent);
                    var _this = possibleConstructorReturn(this, (ObserverComponent.__proto__ || Object.getPrototypeOf(ObserverComponent)).call(this, props, content));
                    return _this.state = new State(_this.state), _this;
                }
                return inherits(ObserverComponent, ComponentClass), ObserverComponent;
            }();
            return Enumerable(ObserverComponent.prototype, "$next", $next), ObserverComponent.injectMoliState = !0, 
            ObserverComponent.prototype.setState = mobx.action.bound(function(data, callback) {
                for (var name in data) this.state[name] = data[name];
                callback && this.$next(callback);
            }), getObComponentClass(ObserverComponent);
        }
        return getObComponentClass(ComponentClass);
    }
    var React__default = "default" in React ? React["default"] : React, _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, classCallCheck = function(instance, Constructor) {
        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    }, createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, 
                "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), 
            Constructor;
        };
    }(), defineProperty = function(obj, key, value) {
        return key in obj ? Object.defineProperty(obj, key, {
            value: value,
            enumerable: !0,
            configurable: !0,
            writable: !0
        }) : obj[key] = value, obj;
    }, inherits = function(subClass, superClass) {
        if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: !1,
                writable: !0,
                configurable: !0
            }
        }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass);
    }, possibleConstructorReturn = function(self, call) {
        if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return !call || "object" != typeof call && "function" != typeof call ? self : call;
    }, isUndefined = function(value) {
        return void 0 === value;
    }, isFunction = function(value) {
        return "function" == typeof value;
    }, isString = function(value) {
        return "string" == typeof value;
    }, isArray = function(val) {
        return "[object Array]" === Object.prototype.toString.call(val);
    }, isObject = function(val) {
        return !isArray(val) && "object" === (void 0 === val ? "undefined" : _typeof(val));
    }, isReactClass = function(componentClass) {
        return isFunction(componentClass) && componentClass.prototype && !!componentClass.prototype.render && !!componentClass.prototype.setState && !!componentClass.prototype.forceUpdate;
    }, deepCopy = function deepCopy(object) {
        var newObject = null;
        if (isArray(object)) {
            newObject = [];
            for (var i = 0; i < object.length; i++) newObject.push(deepCopy(object[i]));
        } else if (isObject(object)) {
            newObject = {};
            for (var k in object) newObject[k] = deepCopy(object[k]);
        } else newObject = object;
        return newObject;
    }, Enumerable = function(target, propertyName, value) {
        Object.defineProperty(target, propertyName, {
            enumerable: !1,
            value: value,
            writable: !1,
            configurable: !1
        });
    }, reactiveMixin = {
        componentWillMount: function() {
            function makePropertyObservableReference(propName) {
                var valueHolder = this[propName], atom = new mobx.Atom("reactive " + propName);
                Object.defineProperty(this, propName, {
                    configurable: !0,
                    enumerable: !0,
                    get: function() {
                        return atom.reportObserved(), valueHolder;
                    },
                    set: function(v) {
                        !isForcingUpdate && isObjectShallowModified(valueHolder, v) ? (valueHolder = v, 
                        skipRender = !0, atom.reportChanged(), skipRender = !1) : valueHolder = v;
                    }
                });
            }
            var _this = this, initialName = this.displayName || this.name || this.constructor && (this.constructor.displayName || this.constructor.name) || "<component>", rootNodeID = this._reactInternalInstance && this._reactInternalInstance._rootNodeID, skipRender = !1, isForcingUpdate = !1;
            makePropertyObservableReference.call(this, "props"), makePropertyObservableReference.call(this, "state");
            var baseRender = this.render.bind(this), reaction = null, isRenderingPending = !1, reactiveRender = function() {
                isRenderingPending = !1;
                var rendering = undefined;
                return reaction.track(function() {
                    try {
                        rendering = mobx.extras.allowStateChanges(!1, baseRender);
                    } catch (error) {
                        throw error;
                    }
                }), rendering;
            };
            this.render = function() {
                return reaction = new mobx.Reaction(initialName + "#" + rootNodeID + ".render()", function() {
                    if (!isRenderingPending && (isRenderingPending = !0, "function" == typeof _this.componentWillReact && _this.componentWillReact(), 
                    !0 !== _this.__$mobxIsUnmounted)) {
                        var hasError = !0;
                        try {
                            isForcingUpdate = !0, skipRender || React__default.Component.prototype.forceUpdate.call(_this), 
                            hasError = !1;
                        } finally {
                            isForcingUpdate = !1, hasError && reaction.dispose();
                        }
                    }
                }), reactiveRender.$mobx = reaction, _this.render = reactiveRender, reactiveRender();
            };
        },
        componentWillUnmount: function() {
            this.render.$mobx && this.render.$mobx.dispose(), this.__$mobxIsUnmounted = !0;
        },
        componentDidMount: function() {},
        componentDidUpdate: function() {},
        shouldComponentUpdate: function(nextProps, nextState) {
            return this.state !== nextState || isObjectShallowModified(this.props, nextProps);
        }
    }, getObComponentClass = function(componentClass) {
        var Custom = componentClass;
        return componentClass.isMobXReactObserver || (Custom = observer(componentClass)), 
        Custom;
    };
    observer(function(_ref) {
        return (0, _ref.children)();
    }).propTypes = {
        children: function(propValue, key, componentName, location, propFullName) {
            if ("function" != typeof propValue[key]) return new Error("Invalid prop `" + propFullName + "` of type `" + _typeof(propValue[key]) + "` supplied to `" + componentName + "`, expected `function`.");
        }
    };
    var Model = function Model(schema) {
        if (classCallCheck(this, Model), !isObject(schema)) throw Error("[moli] Model need argument which type is a Object");
        Enumerable(this, "$schema", deepCopy(schema)), appendState(this, this.$schema.state), 
        appendGetter(this, this, this.$schema.computed), appendAction(this, this, this.$schema);
    }, appendState = function(_this, state) {
        if (void 0 === state) return _this;
        if ("object" !== (void 0 === state ? "undefined" : _typeof(state))) return console.warn("state must be a object!"), 
        _this;
        for (var _key in state) mobx.extendObservable(_this, defineProperty({}, _key, state[_key]));
    }, appendGetter = function(object, context, computeds) {
        if (isUndefined(computeds)) return object;
        for (var _key in computeds) !function(_key) {
            mobx.extendObservable(object, defineProperty({}, _key, mobx.computed(function() {
                return computeds[_key].apply(context, arguments);
            })));
        }(_key);
    }, appendAction = function(object, context, schema) {
        if (isUndefined(schema)) return object;
        for (var _key in schema) !function(_key) {
            var pro = schema[_key];
            isFunction(pro) && Enumerable(object, _key, mobx.action.bound(function() {
                return pro.apply(context, arguments);
            }));
        }(_key);
    }, nextTick = function() {
        function nextTickHandler() {
            pending = !1;
            var copies = callbacks.slice(0);
            callbacks.length = 0;
            for (var i = 0; i < copies.length; i++) copies[i]();
        }
        var _arguments = arguments, callbacks = [], pending = !1, timerFunc = void 0, handleError = function() {
            console.log(_arguments);
        };
        if ("undefined" != typeof setImmediate && isNative(setImmediate)) timerFunc = function() {
            setImmediate(nextTickHandler);
        }; else if ("undefined" == typeof MessageChannel || !isNative(MessageChannel) && "[object MessageChannelConstructor]" !== MessageChannel.toString()) if ("undefined" != typeof Promise && isNative(Promise)) {
            var p = Promise.resolve();
            timerFunc = function() {
                p.then(nextTickHandler);
            };
        } else timerFunc = function() {
            setTimeout(nextTickHandler, 0);
        }; else {
            var channel = new MessageChannel(), port = channel.port2;
            channel.port1.onmessage = nextTickHandler, timerFunc = function() {
                port.postMessage(1);
            };
        }
        return function(cb, ctx) {
            cb = cb || function() {}, ctx = ctx || function() {};
            var _resolve = void 0;
            if (callbacks.push(function() {
                if (cb) try {
                    cb.call(ctx);
                } catch (e) {
                    handleError();
                } else _resolve && _resolve(ctx);
            }), pending || (pending = !0, timerFunc()), !cb && "undefined" != typeof Promise) return new Promise(function(resolve, reject) {
                _resolve = resolve;
            });
        };
    }(), State = function State(state) {
        classCallCheck(this, State), appendState(this, state);
    }, $next = function(fn) {
        return fn = mobx.action.bound(fn), nextTick(fn);
    }, mounted = !1, globalStore = new (function() {
        function Store() {
            classCallCheck(this, Store);
        }
        return createClass(Store, [ {
            key: "createStore",
            value: function(schemas) {
                var _this = this;
                if (isUndefined(schemas) || !isObject(schemas)) throw Error("[moli] createStore need argument which type is a Object");
                var keys = Object.keys(schemas);
                return 0 == keys.length ? this : (keys.map(function(key) {
                    var schema = schemas[key];
                    _this["$" + key] = new Model(schema);
                }), mounted = !0, this);
            }
        }, {
            key: "getStore",
            value: function() {
                return this;
            }
        }, {
            key: "getModel",
            value: function(arg) {
                return isString(arg) && this["$" + arg] ? this["$" + arg] : null;
            }
        }, {
            key: "getModelProps",
            value: function(modelName) {
                var props = {};
                if (isUndefined(modelName)) return this;
                if (isString(modelName)) {
                    var model = this.getModel(modelName, this);
                    props["$" + modelName] = model;
                }
                if (isArray(modelName)) for (var i = 0; i < modelName.length; i++) {
                    var _model = this.getModel(modelName[i], this);
                    props["$" + modelName[i]] = _model;
                }
                return props;
            }
        }, {
            key: "injectProps",
            value: function(componentClass, modelName) {
                var Custom = bindState(componentClass), props = this.getModelProps(modelName);
                return Custom.defaultProps = Object.assign(props, Custom.defaultProps), Custom;
            }
        }, {
            key: "mounted",
            get: function() {
                return mounted;
            }
        } ]), Store;
    }())(), injectProps = globalStore.injectProps.bind(globalStore), action$1 = mobx.action.bound, Moli = function() {
        function Moli() {
            classCallCheck(this, Moli), this.store = globalStore.createStore({});
        }
        return createClass(Moli, [ {
            key: "useStrict",
            value: function(mode) {
                mobx.useStrict(mode);
            }
        }, {
            key: "useStore",
            value: function(storeState) {
                this.store.mounted || (this.store = globalStore.createStore(storeState));
            }
        } ]), Moli;
    }();
    exports["default"] = Moli, exports.action = action$1, exports.bound = function(arg) {
        return isReactClass(arg) ? bindState(arg) : arg;
    }, exports.inject = function(arg) {
        return isReactClass(arg) ? injectProps(arg) : function(Comp) {
            return Comp ? injectProps(Comp, arg) : injectProps(React.Component, arg);
        };
    }, Object.defineProperty(exports, "__esModule", {
        value: !0
    });
});
