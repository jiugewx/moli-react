'use strict';

export default{
  path: "/",
  getComponents(loaction, callback){
    callback(null, require('./index')['default']);
  }
}

