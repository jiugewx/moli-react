/**
 * observer.js部分参考了mobx-react的observer
 */
import { Atom, Reaction, extras } from 'mobx';
import React, { Component } from 'react';

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
        }
    ;

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
      const atom = new Atom("reactive " + propName);
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
      })
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
      reaction = new Reaction(`${initialName}#${rootNodeID}.render()`, () => {
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
                React.Component.prototype.forceUpdate.call(this);
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
          rendering = extras.allowStateChanges(false, baseRender);
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
export function observer(arg1) {
  const componentClass = arg1;

  if (typeof componentClass === "function" && (!componentClass.prototype || !componentClass.prototype.render)
    && !componentClass.isReactClass && !React.Component.isPrototypeOf(componentClass)
  ) {

    class ObserverClass extends Component {
      render() {
        return componentClass.call(this, this.props, this.context);
      }
    }

    ObserverClass.displayName = componentClass.displayName || componentClass.name;
    ObserverClass.contextTypes = componentClass.contextTypes;
    ObserverClass.propTypes = componentClass.propTypes;
    ObserverClass.defaultProps = componentClass.defaultProps;

    return observer(ObserverClass);
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
    mergeReactLifeHook(target, funcName)
  });
  if (!target.shouldComponentUpdate) {
    target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate;
  }
}

export const Observer = observer(({ children }) => children());


// 获得被观察的 getObComponentClass
export const getObComponentClass = function (componentClass) {
  let Custom = componentClass;

  if (!componentClass['isMobXReactObserver']) {
    Custom = observer(componentClass);
  }

  return Custom
};

Observer.propTypes = {
  children: (propValue, key, componentName, location, propFullName) => {
    if (typeof propValue[key] !== 'function')
      return new Error(
        'Invalid prop `' + propFullName + '` of type `' + typeof propValue[key] + '` supplied to' +
        ' `' + componentName + '`, expected `function`.'
      );
  }
};