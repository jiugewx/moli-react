import React, { Component } from "react";
import { useStrict } from 'mobx';
import { globalStore } from "./main/store";
import { inject } from './main/inject';
import { isEmptyObject } from "./utils";

export { action, bound } from './main/bound';// 绑定
export { inject } from './main/inject';

export default class Moli {
  constructor() {
    this.store = globalStore.createStore({});
  }

  useStrict(mode) {
    useStrict(mode)
  }

  // 注入store
  useStore(storeState) {
    // 只允许单例
    if (!this.store.mounted) {
      this.store = globalStore.createStore(storeState)
    }
  }
}
