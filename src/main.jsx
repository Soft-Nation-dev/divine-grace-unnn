import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import Toast from './components/Toast';

import './images/css/landingpage.css';
import './images/css/global.css';
import './images/css/loginpage.css';
import './images/css/homepage.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <Toast>
    <HashRouter >
      <App />
    </HashRouter>
  </Toast>
  </React.StrictMode>
);
