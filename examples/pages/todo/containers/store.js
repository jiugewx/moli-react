export default {
  list: {
    state: {
      list: [
        {
          completed: false,
          value: 'initial-state'
        },
        {
          completed: true,
          value: 'sdaf'
        }
      ]
    },
    submitValue(index, value) {
      this.list[index].value = value
    },
    changeCompleted(index) {
      this.list[index].completed = !this.list[index].completed
    },
    removeItem(index) {
      this.list.splice(index, 1);
    },
    addItem(value) {
      const item = {
        value: value,
        completed: false
      };
      this.list.push(item)
    },
    clearAll() {
      this.list = this.list.filter((item) => {
        return !item.completed
      });
    },
    // 实时计算 computed
    computed: {
      completedList() {
        const list = this.list;
        return list.filter((item) => {
          return item.completed
        })
      },
      activeList() {
        const list = this.list;
        return list.filter((item) => {
          return !item.completed
        })
      },
      leftNumber() {
        let list = this.list;
        list = list.filter((item) => {
          return !item.completed
        });
        return list.length
      }
    }
  },
  mode: {
    // 初始state
    state: {
      mode: 'all'
    },
    changeMode(mode) {
      this.mode = mode
    },
  }
}