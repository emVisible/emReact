import React from "./core/React.js";

let isShow = false
function Convertor() {
  const handle = () => {
    isShow = !isShow
    React.update()
  }
  return (
    <button onClick={handle}>Button</button>
  )
}
const foo = <div>
  foo
</div>


function App() {
  return (<div>
    emReact
    {isShow && foo}
    <Convertor></Convertor>
    {/* {isShow && foo} */}
  </div>
  )
}
export default App