import './App.css';
import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import Login from './Login';
import Manage from './Manage';
import Request from './Request';

function App() {
  return (
      <Router>
        <Switch>
          <Route path="/request" component={Request}></Route>
          <Route path="/manage" component={Manage}></Route>
          <Route path="/login" component={Login}></Route>
          <Route path="*">
            <Redirect to="/login" />
          </Route>
        </Switch>
      </Router>
  )
}

export default App;
