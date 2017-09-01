import React, { Component } from "react";
import ReactDOM, { render } from "react-dom";
import { Router, hashHistory } from "react-router";
import Moli from 'moli-react';
import rootRoute from "./containers/route.js";//路由配置
import store from './containers/store';
const App = new Moli();
App.useStrict(true);
App.useStore(store);

render(
  <Router history={hashHistory} routes={rootRoute} store={App.store}/>,
  document.getElementById('app')
);