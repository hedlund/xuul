import Xuul from './xuul';

const element = (
  <div id="foo">
    <h1>barbz</h1>
    <h2>yolo</h2>
  </div>
);

const container = document.getElementById('root');
Xuul.render(element, container);
