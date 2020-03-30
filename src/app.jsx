import xuul, { render, useState } from './xuul';

const Counter = props => {
  const [state, setState] = useState(1);
  return (
    <h1 onClick={() => setState(state + 1)}>
      Count: {state}
    </h1>
  )
};

const element = <Counter />;
const container = document.getElementById('root');
render(element, container);
