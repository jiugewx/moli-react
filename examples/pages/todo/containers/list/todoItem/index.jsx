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
      editMode: false
    }
  }

  // 可以追溯的
  @action
  handleDoubleClick(item = {}) {
    this.state.value = item.value || '';
    this.state.editMode = true;
    this.then(this.focus);
  }

  // afterRender的回调
  focus() {
    this.refs.edit.focus();
  }

  @action
  handleChange(e) {
    this.state.value = e.target.value;
    // 以下验证then函数是否可以拿到新建的真实的dom结构
    this.then(() => {
      const value = this.state.value;
      const dom = document.getElementById(value);
      console.log(dom);
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
    const { value, editMode } = this.state;
    const { item = {}, index } = this.props;

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
          id={value}
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