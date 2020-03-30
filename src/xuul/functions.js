import { reconcileChildren } from './reconcile';
import { resetWork } from './work';

let wipFiber = null;
let hookIndex = 0;

export function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  wipFiber.hooks = [];
  hookIndex = 0;

  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

export function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    if (action instanceof Function) {
      hook.state = action(hook.state);
    } else {
      hook.state = action;
    }
  });

  const setState = action => {
    hook.queue.push(action);
    resetWork();
  };

  wipFiber.hooks.push(hook);
  ++hookIndex;
  return [hook.state, setState];
}
