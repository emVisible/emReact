import React from "./core/React.js";
// 在处理diff之前, 没有清除oldFiber, 点击事件会多次渲染
// 除了处理原生dom的清除, 还需要处理函数组件的清除
// 当前仅处理第一层的新老节点更替, 实际上需要处理旧节点的多层节点删除

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
const FC = ()=>{
  return <article>Function Component</article>
}

function App() {
  return (<article>
    emReact
    {/* {isShow ? <section>SECTION</section> : <div>DIV</div>} */}
    {isShow ? <FC></FC> : <div>DIV</div>}
    <Convertor></Convertor>
  </article>
  )
}
console.log('App', App)


export default App