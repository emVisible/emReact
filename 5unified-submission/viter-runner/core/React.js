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

/**
 * 一次提交
*/
function commitRoot() {
  commitWork(root.child) // 将app传入
  root = null // 只传入一次
}

/**
 * 递归创建DOM
*/
function commitWork(fiber) {
  if (!fiber) return
  fiber.parent.dom.append(fiber.dom)
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

function initChildren(fiber) {
  const children = fiber.props.children;
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
  if (!fiber.dom) {
    const dom = (fiber.dom = createDOM(fiber.type));
    // 关闭 边创建边添加的code
    // fiber.parent.dom.append(dom);
    updateProps(dom, fiber.props);
  }
  initChildren(fiber);
  if (fiber.child) return fiber.child;
  if (fiber.sibling) return fiber.sibling;
  return fiber.parent?.sibling;
}

requestIdleCallback(workLoop);

const React = {
  render,
  createElement,
};
export default React;
