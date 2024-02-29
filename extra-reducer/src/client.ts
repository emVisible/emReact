import './style.css'
import createStore from './reducer'
// Client Code

const init = {
  value: 0
}
const reducer = function (state = init, action: { type: string }) {
  switch (action.type) {
    case 'eventA':
      init.value++
      console.log("EventA Run")
      break
    case 'eventB':
      console.log("EventB Run")
      break
    default:
  }
  return state
}
const store = createStore(reducer)
const initalState = store.getState()
const unsubscribe = store.subscribe(() => {
  console.log(init)
})

console.log('initalState',initalState)
store.dispatch({
  type: 'eventA'
})

store.dispatch({
  type: 'eventB'
})

console.log('initalState',initalState)