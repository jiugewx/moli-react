import React, { Component } from 'React';
import { inject, action } from "moli-react";

const ESCAPE_KEY = 27;
const ENTER_KEY = 13;

@inject
export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };
  }

  @action
  handleChange(e) {
    this.state.value = e.target.value;
  }

  @action
  cancel() {
    this.state.value = '';
  }

  handleKeyDown(event) {
    if (event.which === ESCAPE_KEY) {
      this.cancel();
    } else if (event.which === ENTER_KEY) {
      this.handleSubmit();
    }
  }

  handleSubmit() {
    const { $list } = this.props;
    const { value } = this.state;
    if (value.trim() !== '') {
      $list.addItem(value);
      this.cancel();
    }
  }

  render() {
    const { value } = this.state;

    return (
      <header className="header"><h1>todos</h1>
        <input className="new-todo"
          onChange={this.handleChange.bind(this)}
          onKeyDown={this.handleKeyDown.bind(this)}
          placeholder="What needs to be done?"
          value={value}
        />
        <input className="toggle-all" type="checkbox"/>
      </header>
    )
  }
}