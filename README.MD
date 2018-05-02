# moli-react
这是一个基于mobx在react上的一个优化实践。

## todo
1. model必须是提前创建，在总分支顶部插入。

## ChangeLog

### v0.2.4
- 方法名称变更:this.then => this.$next; 


## install

```
npm install moli-react --save
```

## 特征
* 1、使用了`inject`,`bound`两个装饰器的ComponentClass，ComponentClass均有`state`,`$next`两个属性，通过`this.state`,`this.$next`可以访问到。
`this.state`里的值都是observabled;
`this.$next` 是`this.state`发生变化,导致render之后的回调,可以这里获取到最新的真实dom结构。
* 2、改写了this.setState方法，this.setState也是一个action,同时this.setState()过之后的this.state依旧是原来的那个(保持this.state的observable)

## 几个概念
### store
这是一颗状态树。跟`redux`的`store`的概念是一样的，全局只有唯一的一颗

### schema 储存在store里的状态模式
* `schema` 是指`store`里用户自定义的对象,即`store`里每个`key`的`value(值)`。这里将`redux`所定义的每个组件的状态扁平化了。`moli-react`只允许`store`设计成一级的形式，尽可能的扁平化`store`.
* `schema` 是一个基础模式，当通过`moli-react`的`inject`方法把`schema`的状态给注入到具体的某个组件的时候，这个组件就可以通过`this.props.$[schema]`（我在这里定义为`model模型`）获取到`schema`的状态。
* `schema` 之间最好不要互相调用。

### model 具体某个组件使用到的状态模型（实例）
`moli-react`的`inject`方法把`schema`的状态给注入到具体的某个组件的时候，这个组件就可以通过`this.props.$[schema]`（我在这里定义为`model模型`），在组件里可以通过`this.props.$[schema]`获取到一个实例化的Model

### component 组件
`moli-react`的`bound`方法可以使ComponentClass拥有 `this.state` 和 `this.$next` 属性。`inject`默认就给ComponentClass添加了`this.state` 和 `this.$next` 属性。

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
* `createStore`所接收的对象(`schemas`)的key将作为Model的name,方便`inject`使用时，可以直接`inject('mode')`的形式将`mode`这个model直接注入到Component,`schemas`值也必须是一个Object(`schema`);
* `schema`中的`state`将作为初始化的`initialState`;
* `schema`中的`computed`是实时计算的的值，可以作为`this[key]`输出,这个值是只读的。
* `schema`中的function都是action`(mobx所定义的action)`。

### inject 共享状态
`@inject`将把所有在store里的`schema`实例化为`Model`注入到组件里。

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
bound 将使得ComponentClass的state变成可观察，并且给组件增加了`this.$next`方法

```
import {action,bound} from 'moli-react';

@bound // 注册在ComponentClass上面可以让组件的this.state变成可以观察的，增加了this.$next 的异步方法
export default class TodoItem extends React.Component {
    constructor(props) {
        super(props)
        // 使用bound，将使得 this.state是一个可观察的对象。
        this.state = {
            value: '',
            editMode: false
        }
    }
    
    @action // 严格模式下，改变state的方法必须要包裹一下action
    handleDoubleClick(item = {}) {
        this.state.value = item.value || '';
        this.state.editMode = true;
        // this.$next 完成 render 之后的回调
        this.$next(this.focus);
    }

    // afterRender的回调
    focus() {
        this.refs.edit.focus()
        this.$next(() => { this.state.value = 2333 })
    }

    render() {

    }
}
 ```

### action 

action = mobx.action.bound `实际上就是mobx的action.bound`

## publish

先安装 `nscript`
```
[sudo] npm install nscript -g
nscript publish.js
```
