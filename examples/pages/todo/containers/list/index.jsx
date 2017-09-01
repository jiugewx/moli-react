import React, { Component } from "react"
import TodoItem from './todoItem';
import { inject } from "moli-react";

@inject(['list', 'mode'])
export default class List extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { list, completedList, activeList } = this.props.$list;
    const { mode } = this.props.$mode;

    const modeSwitcher = {
      'all': () => list,
      'completed': () => completedList,
      'active': () => activeList
    };

    let _list = modeSwitcher[mode]();

    return (
      <section className="main">
        <ul className="todo-list">
          {
            _list.map((item, index) => {
              return <TodoItem
                key={index}
                item={item}
                index={index}
              />
            })
          }
        </ul>
      </section>
    )
  }
}