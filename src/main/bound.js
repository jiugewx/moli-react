import React, { Component } from "react";
import { isReactClass } from '../utils'
import { bindState } from './state';
import * as mobx from "mobx";

export const action = mobx.action.bound;
// 只使用一个
export const bound = function (arg) {
  if (isReactClass(arg)) {
    const componentClass = arg;
    return bindState(componentClass);
  }

  return arg
};