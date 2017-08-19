export const isUndefined = function (value) {
  return typeof value === 'undefined';
};

export const isArray = function (val) {
  return Object.prototype.toString.call(val) === '[object Array]';
};

export const isObject = function (val) {
  return !isArray(val) && (typeof val === "object");
};

export const deepCopy = function (object) {
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

export const copy = function () {

};