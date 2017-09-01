import React, { Component } from "react";
import './store';
import Header from "./header";
import Footer from "./footer";
import List from "./list";
import { fn } from 'utils'
import './index.less';

export default class Main extends React.Component {
  render() {
    return (
      <section className="todoapp">
        <Header/>
        <List/>
        <Footer/>
      </section>
    )
  }
}