import React, {Component} from 'React';
import {inject} from "moli-react";
import classnames from 'classnames';

@inject(['list', 'mode'])
export default class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.list = [
      {
        text: '所有',
        mode: 'all'
      },
      {
        text: '未完成',
        mode: 'active'
      },
      {
        text: '已完成',
        mode: 'completed'
      },
    ]
  }

  render() {
    const {$list, $mode} = this.props;
    return (
      <footer className="footer">
        <span className="todo-count">
            <span>剩余</span>
            <strong>{$list.leftNumber}</strong>
            <span>个任务</span>
        </span>
        <ul className="filters">
          {
            this.list.map((item, index) => {
              const selectClass = classnames({
                'item': true,
                'selected': $mode.mode === item.mode
              });

              return <li key={index}>
                <span className={selectClass}
                  onClick={() => $mode.changeMode(item.mode)}>{item.text}</span>
              </li>
            })
          }
        </ul>
        <button onClick={$list.clearAll}
          className="clear-completed">清除完成的
        </button>
      </footer>
    )
  }
}