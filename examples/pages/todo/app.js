import React, { Component } from "react";
import { render } from "react-dom";
import { Router, hashHistory } from "react-router";
import rootRoute from "./containers/route.js";//路由配置
import store from './containers/store';
store.useStrict(true);

render(
  <Router history={hashHistory} routes={rootRoute} />,
  document.getElementById('app')
);

// import { start } from 'moli-react';
// start(
//   <Router history={hashHistory} routes={rootRoute} />,
//   document.getElementById('app')
// )