# Moli
这是一个基于mobx在react上的一个优化实践。

## todo
1、各个model之间是否可以互相调用。
2、model必须是提前创建。在总分支顶部插入。
3、给action之后的函数增加一个回调。增加了then函数，

## install

```
npm install moli-react --save
```

## 特征
使用了`inject`,`action`两个装饰器的ComponentClass，ComponentClass均有`state`,`then`两个属性，通过`this.$state`,`this.$then`可以访问到。
`this.state`里的值都是observabled;
`this.then` 是`this.state`发生变化,导致render之后的回调

## api
### createStore 
使用`createStore`可以生成store，一定要在组件路由的顶层注入store,否则将会影响`inject`功能的使用
createStore接收一个object作为初始化，如：
```
import {createStore} from 'moli-react'

createStore({
    items:{
        state:{
            list:[]
        },
        computed:{
            
        }
    },
    mode: {
        // 初始state
        state: {
            editMode: false
        },
        changeMode(mode) {
            this.editMode = mode
        },
        computed:{
            unEdit()
                return !this.editMode
            }
        }
    }
})
```
`createStore`所接收的对象(`schemas`)的key将作为Model的name,方便`inject`使用时，可以直接`inject('mode')`的形式将`mode`这个model直接注入到Component,`schemas`值也必须是一个Object(`schema`);
`schema`中的`state`将作为初始化的`initialState`;
`schema`中的`computed`是实时计算的的值，可以作为`this[key]`输出,这个值是只读的。
`schema`中的function都是action。

### inject 共享状态
`@inject`将把所有在store里的Model注入到组件里。
`@inject('mode')`,表示只把mode这个Model注入到ComponentClass里。
也可以使用Array作为参数，如：
`@inject(['mode','items'])`,表示吧`mode`,`itmes`这个两个模式传入到了ComponentClass

在ComponentClass里可以通过`props[$name]`获取到注入的Model，如：`this.props.$mode` = `mode`这个Model;
具体事例：
```React
@inject(['items', 'mode'])
export default class List extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { list, completedList, activeList } = this.props.$items;
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
```

### bound 绑定私有属性
bound 将使得ComponentClass的state变成可观察，增加了this.then方法

```
import {action,bound} from 'moli-react';

@bound // 注册在ComponentClass上面可以让组件的this.state变成可以观察的，增加了this.then的异步方法
export default class TodoItem extends React.Component {
    constructor(props) {
        super(props)
        // 使用bound，将使得 this.$state是一个可观察的对象。
        this.state = {
            value: '',
            editMode: false
        }
    }
    
    @action // 严格模式下，改变state的方法必须要包裹一下action
    handleDoubleClick(item = {}) {
        this.state.value = item.value || '';
        this.state.editMode = true;
        // this.then 完成 render 之后的回调
        this.then(this.focus);
    }

    // afterRender的回调
    focus() {
        this.refs.edit.focus()
        then(() => { this.$state.value = 2333 })
    }

    render() {

    }
}
 ```

### action 

action = mobx.action.bound

## publish

先安装 `nscript`
```
[sudo] npm install nscript -g
nscript publish.js
```
