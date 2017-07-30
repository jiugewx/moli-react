import {observer} from "mobx-react";
import React, {Component} from "react";
import Model from "./model";
import {isUndefined} from './util'


export class Moli {
  constructor() {
    this.$models = {};
    this.$store = {}; // 存储所有的状态
    this.$actions = {}; // 存储所有的状态
  }

  // 包裹组件，直接注入store，actions
  provide(Component) {
    const self = this;
    class Index extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          $actions: self.$actions,
          $store: self.$store,
        }
      }

      render() {
        return (<Component {...this.state} {...this.props}/>);
      }
    }
    return Index
  }

  // 增加Model
  append(_Model) {
    if (_Model instanceof Model) {
      const name = _Model.$name;
      this.$models[name] = _Model;
      this.$store[name] = _Model.$state; // 只拿状态
      this.$actions[name] = _Model.$actions; // 只拿状态
      return this;
    }
    throw Error('you should append a object which is Instance of Model!')
  }

  // 删除某个model
  remove(modelName) {
    delete this.$models[modelName];
    delete this.$store[modelName];
    delete this.$actions[modelName];
  }

  // 创建一个模式
  createModel(model) {
    return new Model(model)
  }

  // 获取store
  getStore() {
    return this.$store
  }

  // 获取model
  getModel(arg) {
    if (arg instanceof Model) {
      return arg;
    } else if (typeof arg === 'string' && this.$models[arg]) {
      return this.$models[arg]
    }
    return null
  }

  // 注入 model [ state, 还有 action => props] 为了共享；每个组件都是用的这一套
  inject(modelName) {
    const self = this;
    return (Comp) => {
      class Index extends Component {
        constructor(props, context) {
          super(props, context);
        }

        render() {
          let props = self.getModel(modelName).inject();
          return React.createElement(observer(Comp), self.filterProps(props, this.props))
        }
      }

      return Index
    };
  }

  // 继承 model [ state, 还有 action => props] 以达到复用：每个组件都用的是全新的一套
  // 如果给继承者命名，那么就会保留状态,组件重新生成的时候，会以store里存储状态初始化
  extend(modelName, extendName) {
    const self = this;
    return (Comp) => {
      class Index extends Component {
        constructor(props, context) {
          super(props, context);
          this.$name = '';
        }

        // 组件卸载要去除跟踪
        componentWillUnmount() {
          if (isUndefined(extendName)) {
            let newName = this.$name;
            self.remove(newName)
          }
        }

        render() {
          let newName = modelName + "/" + extendName;
          let Model = self.getModel(newName);
          let props = Model ? Model : self.getModel(modelName).extendAs(extendName);
          this.$name = props.$name;
          return React.createElement(observer(Comp), self.filterProps(props, this.props))
        }
      }
      return Index
    };
  }

  // 输出筛选的props
  filterProps(props, _thisProps) {
    let newProps = {
      $state: props.$state,
      $actions: props.$actions,
      $getters: props.$getters
    };
    return Object.assign(newProps, _thisProps);
  }
}

const moli = new Moli();
window['moli'] = moli;

export const provide = moli.provide.bind(moli);
export const extend = moli.extend.bind(moli);
export const inject = moli.inject.bind(moli);
export const getStore = moli.getStore.bind(moli);
export const append = moli.append.bind(moli);
export const createModel = moli.createModel.bind(moli);
export default moli;
