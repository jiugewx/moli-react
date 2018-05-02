'use strict';
import React, { Component } from "react";
import classnames from 'classnames';
import { inject, action } from "moli-react";

const ESCAPE_KEY = 27;
const ENTER_KEY = 13;


@inject('list')
export default class TodoItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      editMode: false,
      watcher: 0
    }
  }

  // 可以追溯的
  @action
  handleDoubleClick(item = {}) {
    this.state.value = item.value || '';
    this.state.editMode = true;
    this.$next(this.focus);
  }

  // afterRender的回调
  focus() {
    this.refs.edit.focus();
  }

  @action
  handleChange(e) {
    console.log("=======start======");
    this.state.value = e.target.value;
    // 以下验证then函数是否可以拿到新建的真实的dom结构
    this.$next(() => {
      const value = this.state.value;
      const watcher = this.state.watcher;
      const id = value + "_" + watcher;
      const dom = document.getElementById(id);
      console.log("nextTick-dom-id:", dom.getAttribute("id"));
      console.log("nextTick-dom-value:", dom.value);
      this.state.watcher++; // 第二次改变state，会触发render。先完成上级的异步队列，再进行本级的异步队列

      this.$next(() => {
        console.log("nextTick-1-dom-id:", dom.getAttribute("id"));
        console.log("nextTick-1-dom-value:", dom.value);
      });

      Promise.resolve().then(() => {
        console.log("promise-1:", dom.getAttribute("id"));
      })
    });

    this.$next(() => {
      console.log("nextTick-2");
    });

    this.$next(() => {
      console.log("nextTick-3");
    })
  }

  @action
  cancel() {
    this.state.editMode = false;
  }

  handleSubmit() {
    const { index, $list } = this.props;
    $list.submitValue(index, this.state.value);
    this.cancel();
  }

  handleKeyDown(event) {
    if (event.which === ESCAPE_KEY) {
      this.cancel()
    } else if (event.which === ENTER_KEY) {
      this.handleSubmit(event);
    }
  }

  render() {
    const { changeCompleted, removeItem } = this.props.$list || {};
    const { value, editMode, watcher } = this.state;
    const { item = {}, index } = this.props;
    const id = value + "_" + watcher;
    console.warn("render-item");

    const completeClass = classnames({
      "completed": item.completed,
      "editing": editMode
    });

    return (
      <li className={completeClass} id={"id_" + index}>
        <div className="view">
          <input className="toggle" type="checkbox" onClick={() => changeCompleted(index)}/>
          {/* <input className="toggle" type="checkbox" onClick={this.sayHello.bind(this)} /> */}
          <label onDoubleClick={this.handleDoubleClick.bind(this, item)}>{item.value}</label>
          <button className="destroy" onClick={() => removeItem(index)}/>
        </div>
        <input
          id={id}
          className="edit"
          ref='edit'
          onBlur={this.handleSubmit.bind(this)}
          onChange={this.handleChange.bind(this)}
          onKeyDown={this.handleKeyDown.bind(this)}
          value={value}
        />
      </li>
    )
  }
}