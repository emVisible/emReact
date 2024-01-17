import React from "./core/React.js";
const App = React.createElement(
  "div",
  {
    id: "app",
  },
  "emReact",
);

console.log('App', App) // 直接调用React.createElement()
console.log(<div>emReact</div>) //通过解析jsx并调用React.createElement(), 就是以语法糖的形式提高可读性和可维护性

//===========================================================================

function inspect() {
  return <div id="foo">
    emReact
    <section>
      emReact-children1
    </section>
    <section>
      emReact-children2
    </section>
  </div>
}
/**
 * 输出
 *  ƒ inspect() { return  @__PURE__  React.createElement("div", { id: "foo" }, "emReact");}
 *
 * 本质上还是调用React.createElement()方法
*/
console.log(inspect)

export default App