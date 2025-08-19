import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

// Expose function to window
window.handleWikiLinkClick = (pageName) => {
  const app = root._internalRoot.current.child.stateNode;
  app.handleWikiLinkClick(pageName);
};