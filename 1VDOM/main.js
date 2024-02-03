/**
 * Core:
 *   1. 动态创建VDOM
 *     VDOM是基于Js对象对DOM进行抽象描述,
 *     最后根据React自身协调渲染, 来达成从抽象到具体的过程。
 *   2. 动态创建VNode
 *     VNode是VDOM的子集, 是其中的一部分
 *     同样是基于JS对象来进行有选择地创建, 最后添加到VDOM上
 */

import ReactDOM from "./core/ReactDOM.js";
import App from "./core/App.js";

ReactDOM.createRoot(document.getElementById("root")).render(App)