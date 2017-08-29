
import { Component, Children } from 'react'
import { render } from "react-dom";

export function createProvider(storeKey = 'store', subKey) {
    class Provider extends Component {
        getChildContext() {
            return { [storeKey]: this[storeKey] }
        }

        constructor(props, context) {
            super(props, context)
            this[storeKey] = props.store;
        }

        render() {
            return Children.only(this.props.children)
        }
    }

    return Provider
}

const Provider = createProvider()

export const start =  function() {
    render.apply(this, arguments)
}
