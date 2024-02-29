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
  <div>foo's child</div>
  <div>foo's child2</div>
</div>

const bar = <div>
  bar
</div>

// 函数组件不会产生这种问题
const FC = () => {
  return (
    <div>
      <article>
        <section>
          Article Section1
        </section>
      </article>
      <article>
        <section>
          Article Section2
        </section>
      </article>
    </div>
  )
}

function App() {
  return (<div>
    emReact
    {isShow ? foo : bar}
    {/* {isShow ? <FC></FC> : <div>DIV</div>} */}
    <Convertor></Convertor>
  </div>
  )
}
console.log('App', App)


export default App