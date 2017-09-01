import React, { Component } from "react";
import { useStrict } from 'mobx';
import { globalStore } from "./main/store";
import { inject } from './main/inject';

export { action, bound } from './main/bound';// 绑定
export { inject } from './main/inject';

export default class Moli {
  constructor() {
    this.store = {};
  }

  useStrict(mode) {
    useStrict(mode)
  }

  // 注入store
  useStore(store) {
    this.store = globalStore.createStore(store)
  }
}
