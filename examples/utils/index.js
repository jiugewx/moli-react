/**
 * Created by xinye on 2017/4/28.
 */

const util = {};
util.menu = {};
util.firstMenuName = "";

util.config = {
  debug: process.env.NODE_ENV != 'production',
  // HOST: process.env.NODE_ENV != 'production' ? "http://localhost:3000" : "/proxyPrefix"
};

util.log = function (msg, msg2, msg3) {

  if (util.config.debug) {
    if (msg3) {
      console.log(msg, msg2, msg3);
      return
    } else if (msg2) {
      console.log(msg, msg2);
      return
    } else {
      console.log(msg);
    }
  }
};

export const fn = {
  isUndefined: function (value) {
    return typeof value === 'undefined';
  },
  isArray: function (val) {
    return Object.prototype.toString.call(val) === '[object Array]';
  },
  isObject: function (val) {
    return !this.isArray(val) && (typeof val === "object");
  },
  deepCopy: function (object) {
    var newObject = null;
    if (this.isArray(object)) {
      newObject = [];
      for (var i = 0; i < object.length; i++) {
        newObject.push(this.deepCopy(object[i]));
      }
    } else if (this.isObject(object)) {
      newObject = {};
      for (var k in object) {
        newObject[k] = this.deepCopy(object[k]);
      }
    } else {
      newObject = object;
    }

    return newObject;
  },
};

export default util