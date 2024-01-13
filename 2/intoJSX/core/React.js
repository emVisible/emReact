
/**
 * [动态创建VNode] 动态创建VNode
 * @param {string} type 节点类型
 * @param {object} props 节点属性
 * @param {...(object|string)} children 子节点, 以数组方式收集
 * @return {object} 返回VNode
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child == 'string' ? createTextNode(child) : child
      }),
    },
  };
}

/**
 * [动态创建VNode] 动态创建VTextNode
 * @param {string} text nodeValue
 * @return 返回VTextNode
 */
function createTextNode(text) {
  console.log("====实际上调用了导入的React方法====")
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/**
 * 渲染 / 挂载到DOM
 * @param el VNode
 * @param container 真实DOM容器
*/
function render(el, container) {
  // 第一步抽象: 创建节点
  const dom =
    el.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(el.type);

  // 第二步抽象: 设置props && 处理children(递归)
  Object.keys(el.props).forEach((prop) => {
    if (prop !== 'children') {
      dom[prop] = el.props[prop]
    }
  })

  const children = el.props.children
  children.forEach((child) => {
    render(child, dom)
  })

  // 第三部抽象: 挂载
  container.append(dom)
}

const React = {
  render,
  createElement
}

export default React