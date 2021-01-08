import React from 'react';
import ReactDOM from 'react-dom';

// initial firebase
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/analytics';

// firebase redux
import { Provider } from 'react-redux';
import { applyMiddleware, createStore, combineReducers } from 'redux';
import { createFirestoreInstance, firestoreReducer } from 'redux-firestore';
import { ReactReduxFirebaseProvider } from 'react-redux-firebase';
import logger from 'redux-logger';

import loginReducers from './redux/loginReducers';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { firebaseConfig } from './constants'

// react-redux-firebase config
const rrfConfig = {
  userProfile: 'users',
  useFirestoreForProfile: true // Firestore for Profile instead of Realtime DB
  // enableClaims: true // Get custom claims along with the profile
}

// initialize app & firestore module
firebase.initializeApp(firebaseConfig);
firebase.firestore();
firebase.analytics();

// Add firebase to reducers
const rootReducer = combineReducers({
  // firebase: firebaseReducer
  firestore: firestoreReducer, // <- needed if using firestore,
  userData: loginReducers
});

// Create store with reducers and initial state
const store = createStore(rootReducer, 
    applyMiddleware(logger)
);

const rrfProps = {
  firebase,
  config: rrfConfig,
  dispatch: store.dispatch,
  createFirestoreInstance // <- needed if using firestore
}

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <ReactReduxFirebaseProvider {...rrfProps}>
        <App />
      </ReactReduxFirebaseProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
