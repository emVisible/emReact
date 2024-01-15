import React from "./core/React.js";
// const App = React.createElement(
//   "div",
//   {
//     id: "app",
//   },
//   "emReact",
// );

function Counter({ num }) {
  return <div >Counter {num}</div>
}
function CounterContainer({ num }) {
  return (
    <div>
      CounterContainer-
      <Counter num={num}></Counter>
    </div>
  )
}
function App() {
  return (<div>
    emReact
    <Counter num={10}></Counter>
    <CounterContainer num={20}></CounterContainer>
  </div>
  )
}
console.log('App', App)


export default App