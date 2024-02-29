export default function createStore(reducer: Function) {
  if (typeof reducer !== 'function') throw new TypeError("Reducer TypeError")
  let state: any;
  let event: Function[] = []
  const getState = () => {
    return state
  }

  const subscribe = (e: Function) => {
    if (!event.includes(e)) {
      event.push(e)
    }

    return function unsubscribe() {
      const idx = event.indexOf(e)
      event.splice(idx, 1)
    }
  }

  const dispatch = (action: { type: string }) => {
    if (typeof action.type === 'undefined') throw new TypeError("Param \"type\" must be a stirng.")
    state = reducer(state, action)
    for (const e of event) {
      e()
    }
    return action
  }
  // redux 初次渲染
  const init = {
    type: '@@redux/INIT' + Math.random().toString(36).split('.')
  }
  dispatch(init)

  return {
    getState,
    subscribe,
    dispatch
  }
}