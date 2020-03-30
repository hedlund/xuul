import { createDom, updateDom } from './dom';
import { updateFunctionComponent } from './functions';
import * as r from './reconcile';

let wipRoot = null;
let currentRoot = null;
let nextUnitOfWork = null;
let deletions = null;

export function render(element, container) {
  startWork({
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  });
}

export function resetWork() {
  startWork({
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot,
  });
}

function startWork(fiber) {
  wipRoot = fiber;
  nextUnitOfWork = fiber;
  deletions = [];
}

function performUnitOfWork(fiber) {
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  return findNextUnitOfWork(fiber);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  r.reconcileChildren(fiber, fiber.props.children);
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
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

  if (fiber.effectTag === r.TAG_DELETION) {
    commitDeletion(fiber, domParent);
  } else if (fiber.dom) {
    if (fiber.effectTag === r.TAG_PLACEMENT) {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === r.TAG_UPDATE) {
      updateDom(
        fiber.dom,
        fiber.alternate.props,
        fiber.props,
      );
    }
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

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    
    shouldYield = deadline.timeRemaining() < 1;

    if (!nextUnitOfWork && wipRoot) {
      commitRoot();
    }
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
