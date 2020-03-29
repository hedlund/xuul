import Xuul from './xuul';

const App = props => (
  <h1>Hi {props.name}</h1>
);

const element = <App name="foo" />;
const container = document.getElementById('root');
Xuul.render(element, container);
