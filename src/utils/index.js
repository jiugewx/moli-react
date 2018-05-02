export const isUndefined = function(value) {
  return typeof value === 'undefined';
};

export const isFunction = function(value) {
  return typeof value === 'function';
};

export const isString = function(value) {
  return typeof value === 'string';
};

export const isArray = function(val) {
  return Object.prototype.toString.call(val) === '[object Array]';
};

export const isObject = function(val) {
  return !isArray(val) && (typeof val === "object");
};

export const isReactClass = function(componentClass) {
  return isFunction(componentClass) && (
      componentClass.prototype
      && !!componentClass.prototype.render
      && !!componentClass.prototype.setState
      && !!componentClass.prototype.forceUpdate
    )
};

export const isHTMLElement = function(node) {
  return typeof node === 'object' && node !== null && node.nodeType && node.nodeName;
};

export const deepCopy = function(object) {
  let newObject = null;
  if (isArray(object)) {
    newObject = [];
    for ( let i = 0; i < object.length; i++ ) {
      newObject.push(deepCopy(object[i]));
    }
  } else if (isObject(object)) {
    newObject = {};
    for ( let k in object ) {
      newObject[k] = deepCopy(object[k]);
    }
  } else {
    newObject = object;
  }
  return newObject;
};

export const Enumerable = function(target, propertyName, value) {
  Object.defineProperty(target, propertyName, {
    enumerable: false,
    value: value,
    writable: false,
    configurable: false,
  })
};