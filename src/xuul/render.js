import { TEXT_ELEMENT } from './consts';

const TAG_UPDATE = Symbol('UPDATE');
const TAG_PLACEMENT = Symbol('PLACEMENT');
const TAG_DELETION = Symbol('DELETION');

export function render(element, container) {
  workRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = workRoot;
}

let workRoot = null;
let currentRoot = null;
let nextUnitOfWork = null;
let deletions = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    
    shouldYield = deadline.timeRemaining() < 1;

    if (!nextUnitOfWork && workRoot) {
      commitRoot();
    }
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  return findNextUnitOfWork(fiber);
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(workFiber, elements) {
  let index = 0;
  let oldFiber = workFiber.alternate && workFiber.alternate.child;
  let prevSibling = null;

  while (
    index < elements.length || 
    oldFiber !== null
  ) {
    const element = elements[index];
    let newFiber = null;

    const sameType =
      oldFiber && element &&
      element.type === oldFiber.type;

    // Here React also uses keys, that makes a better reconciliation. 
    // For example, it detects when children change places in the element array.

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: workFiber,
        alternate: oldFiber,
        effectTag: TAG_UPDATE,
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: workFiber,
        alternate: null,
        effectTag: TAG_PLACEMENT,
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = TAG_DELETION;
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      workFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    ++index;
  }
}

function findNextUnitOfWork(fiber) {
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(workRoot.child);
  currentRoot = workRoot;
  workRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while(!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (
    fiber.effectTag === TAG_PLACEMENT &&
    fiber.dom !== null
  ) {
    domParent.appendChild(fiber.dom);
  } else if (
    fiber.effectTag === TAG_UPDATE &&
    fiber.dom !== null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props,
    );
  } else if (fiber.effectTag === TAG_DELETION) {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function createDom(fiber) {
  const dom =
    fiber.type === TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = key => key.startsWith('on');
const isProperty = key => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);
const getEventType = propName =>
  propName
    .toLowerCase()
    .substring(2);

function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key =>
      !(key in nextProps) ||
      isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = getEventType(name);
      dom.removeEventListener(
        eventType,
        prevProps[name],
      );
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = '';
    });

  // Set new of changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = getEventType(name);
      dom.addEventListener(
        eventType,
        nextProps[name],
      );
    });
}
