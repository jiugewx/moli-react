import React, {Component} from "react";
import {observer} from "./observer";
import Model from "./model";
import {isArray, isObject, isUndefined} from './util'


export class Moli {
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
            this.$store[key] = new Model(schemas[key])
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

            return this._getInjectComponent(modelName, Component)
        };
    }

    // 复制 model ,复用
    copy(modelName, extendName) {
        const self = this;
        return (Comp) => {
            class Index extends Component {
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
                    return <Custom {...this.props} {...props}/>
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
        return class Index extends Component {
            render() {
                const props = self._getMobxProps(modelName);
                const Custom = observer(Comp);
                return <Custom {...props} {...this.props} />
            }
        }
    }
}

const globalMoli = new Moli();
window['moli'] = globalMoli;

export const copy = globalMoli.copy.bind(globalMoli);
export const inject = globalMoli.inject.bind(globalMoli);
export const createModel = globalMoli.createModel.bind(globalMoli);
export const getStore = globalMoli.getStore.bind(globalMoli);
export const createStore = globalMoli.createStore.bind(globalMoli);
export default globalMoli;
