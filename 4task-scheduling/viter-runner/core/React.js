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
function createTextNode(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// 当前任务设置为null, 当进入render时进行赋值
let nextWorkOfUnit = null

// Render会通过业务代码进行一次初始赋值, 将"创建一个id为root的div标签作"作为初始任务
function render(el, container) {
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el]
    }
  }
}

/**
 * 任务调度器
 *   维护DOM遍历 && 链表建立的作业, 直至DOM树遍历完成 && 链表建立完毕
*/
function workLoop(deadline) {
  let isStop = false // 终止信号
  while (!isStop && nextWorkOfUnit) { // nextWorkOfUnit是针对遍历完毕后会返回undeinfed导致程序出错设置的
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit) // 处理当前任务, 处理完毕后更新下一个任务
    isStop = deadline.timeRemaining() < 1 // 检测Task的剩余时间, 如果Task即将结束, 那么终止循环, 进入下一个Task
  }
  requestIdleCallback(workLoop) // 递归直至nextWorkOfUnit为空, 即DOM遍历完毕
}

function createDOM(type) {
  return type == "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type)
}

function updateProps(dom, props) {
  Object.keys(props).forEach((prop) => {
    if (prop !== 'children') {
      dom[prop] = props[prop]
    }
  })
}

function initChildren(fiber) {
  const children = fiber.props.children
  let prevChild = null // 存储上一个孩子节点
  /**
   * child实际上是VDOM, 给child添加属性会破坏VDOM的结构, 所以需要借助额外的空间
  */
  children.forEach((child, index) => {
    // work是基于VNode封装的链表, 拥有三个指向, 分别是parent、sibling、child
    // 设置子VDOM, 遍历children, 将当前的RootVDOM和下一层子节点链接
    const newWork = {
      dom: null,
      type: child.type,
      props: child.props,

      child: null,
      parent: fiber,
      sibling: null,
    }
    if (index === 0){
      fiber.child = newWork // 设置child
    } else {
      prevChild.sibling = newWork // 设置sibling
    }
    prevChild = newWork // 更新上一个孩子节点
  })
}
/**
 * 分治——将一个节点的"DOM渲染 && 链表建立"作为一个Task执行
 * @return 返回下一个Task
*/
function performWorkOfUnit(fiber) {
  // Stage 1: 创建DOM
  if (!fiber.dom) { // 在初始化时传递的work.dom是存在的, 不需要进行DOM创建
    // 创建一个DOM, 并将work.dom指向创建的DOM
    const dom = (fiber.dom = createDOM(fiber.type))
    // 通过指针将dom添加到父级容器中
    fiber.parent.dom.append(dom)
    // Stage 2: 设置属性, 将VDOM的属性转移到DOM中
    updateProps(dom, fiber.props)
  }
  // Stage 3: 链表转换
  initChildren(fiber)

  // Stage 4: 根据DOM树建立的链表关系, 返回新任务
  if (fiber.child) return fiber.child // 如果当前任务有孩子节点, 那么下一个任务就是这个孩子节点
  if (fiber.sibling) return fiber.sibling // 如果当前任务没有孩子节点, 但有兄弟节点, 那么下一个任务返回兄弟节点
  return fiber.parent?.sibling // 如果当前任务没有孩子节点也没有兄弟节点, 返回当前任务的叔叔节点(父节点的兄弟节点).
  // 如果都没有则返回undefined, 说明DOM遍历完毕
}

requestIdleCallback(workLoop)

const React = {
  render,
  createElement
}
export default React