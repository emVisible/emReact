function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        /**
         * 处理function component传参
        */
        const isTextNode = typeof child === 'string' || typeof child === 'number'
        return isTextNode ? createTextNode(child) : child
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
let root = null

let nextWorkOfUnit = null;

function render(el, container) {
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el],
    },
  };
  root = nextWorkOfUnit
}

function commitRoot() {
  commitWork(root.child)
  root = null
}

/**
 * 递归创建DOM
*/
function commitWork(fiber) {
  if (!fiber) return
  let fiberParent = fiber.parent
  // 处理函数 && 嵌套函数的情况: 向上查找拥有dom的节点, 作为父节点
  while(!fiberParent.dom) {
    fiberParent = fiberParent.parent
  }
  if (fiber.dom) {
    fiberParent.dom.append(fiber.dom)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
function workLoop(deadline) {
  let isStop = false;
  while (!isStop && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);
    isStop = deadline.timeRemaining() < 1;
  }
  if (!nextWorkOfUnit && root) {
    commitRoot()
  }
  requestIdleCallback(workLoop);
}

function createDOM(type) {
  return type == "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function updateProps(dom, props) {
  Object.keys(props).forEach((prop) => {
    if (prop !== 'children') {
      dom[prop] = props[prop];
    }
  });
}

function initChildren(fiber, children) {
  let prevChild = null;
  children.forEach((child, index) => {
    const newWork = {
      dom: null,
      type: child.type,
      props: child.props,
      child: null,
      parent: fiber,
      sibling: null,
    };
    if (index === 0) {
      fiber.child = newWork;
    } else {
      prevChild.sibling = newWork;
    }
    prevChild = newWork;
  });
}

function performWorkOfUnit(fiber) {
  // function component 会将函数作为type传递进来
  const isFunc = typeof fiber.type == 'function'
  // function component不需要创建dom
  if (!isFunc) {
    if (!fiber.dom) {
      const dom = (fiber.dom = createDOM(fiber.type));
      updateProps(dom, fiber.props);
    }
  }
  const children = isFunc ? [fiber.type(fiber.props)] : fiber.props.children;
  initChildren(fiber, children);
  if (fiber.child) return fiber.child;
  /**
   * 循环查找, 直到查找到最近的父级节点的sibling
  */
  let nextFiber = fiber
  while(nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return nextFiber;
}

requestIdleCallback(workLoop);

const React = {
  render,
  createElement,
};
export default React;
