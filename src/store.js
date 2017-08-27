import { isUndefined, isObject, isArray, isFunction, isString } from './utils'
import Model from "./model";

let namePrefix = "$"; // 预制
export let globalStore = {};

export const createStore = function (schemas) {
    if (isUndefined(schemas) || !isObject(schemas)) {
        throw Error('[moli] createStore need argument which type is a Object')
    }
    for (let key in schemas) {
        const schema = schemas[key];
        globalStore[namePrefix + key] = new Model(schema)
    }

    return globalStore
}

// 获取model实例
export function getModel(arg, store) {
    if (isString(arg) && store[namePrefix + arg]) {
        return store[namePrefix + arg]
    }
    return null
}

export function getMobxProps(modelName, store) {
    let props = {};
    if (isString(modelName)) {
        const model = getModel(modelName, store);
        const name = modelName;
        props[namePrefix + name] = model;
    }

    if (isArray(modelName)) {
        for (let i = 0; i < modelName.length; i++) {
            const model = getModel(modelName[i], store);
            const name = modelName[i];
            props[namePrefix + name] = model;
        }
    }

    return props
}