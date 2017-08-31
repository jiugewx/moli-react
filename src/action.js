import React, { Component } from "react";
import { isReactClass } from './utils'
import { bindState } from './state';
import * as mobx from "mobx";

// 只使用一个
export const action = function (arg) {
  if (isReactClass(arg)) {
    const componentClass = arg;
    return bindState(componentClass);
  }

  return mobx.action.bound.apply(null, arguments)
};