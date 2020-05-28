import * as firebase from 'firebase';
import firestore from 'firebase/firestore'
  var firebaseConfig = {
    apiKey: "AIzaSyDPi80ilddhtCh9wfPIxT5YLt8hLa1zZoM",
    authDomain: "diningdollarreactnative.firebaseapp.com",
    databaseURL: "https://diningdollarreactnative.firebaseio.com",
    projectId: "diningdollarreactnative",
    storageBucket: "diningdollarreactnative.appspot.com",
    messagingSenderId: "529283379449",
    appId: "1:529283379449:web:aaea13bb1526e3b182b228"
  };

firebase.initializeApp(firebaseConfig);

firebase.firestore();

export default firebase;

// import firebase from 'firebase'; // 4.8.1

// class Fire {
//   constructor() {
//     this.init();
//     this.observeAuth();
//   }

//   init = () => {
//     if (!firebase.apps.length) {
//         firebase.initializeApp({
//           apiKey: "AIzaSyDPi80ilddhtCh9wfPIxT5YLt8hLa1zZoM",
//           authDomain: "diningdollarreactnative.firebaseapp.com",
//           databaseURL: "https://diningdollarreactnative.firebaseio.com",
//           projectId: "diningdollarreactnative",
//           storageBucket: "diningdollarreactnative.appspot.com",
//           messagingSenderId: "529283379449",
//           appId: "1:529283379449:web:aaea13bb1526e3b182b228"
//       });
//     }
//   }

//   observeAuth = () =>
//     firebase.auth().onAuthStateChanged(this.onAuthStateChanged);

//   onAuthStateChanged = user => {
//     if (!user) {
//       try {
//         firebase.auth().signInAnonymously();
//       } catch ({ message }) {
//         alert(message);
//       }
//     }
//   };

//   get uid() {
//     return (firebase.auth().currentUser || {}).uid;
//   }

//   get ref() {
//     return firebase.database().ref('messages');
//   }

//   parse = snapshot => {
//     const { timestamp: numberStamp, text, user } = snapshot.val();
//     const { key: _id } = snapshot;
//     const timestamp = new Date(numberStamp);
//     const message = {
//       _id,
//       timestamp,
//       text,
//       user,
//     };
//     return message;
//   };

//   on = callback =>
//     this.ref
//       .limitToLast(20)
//       .on('child_added', snapshot => callback(this.parse(snapshot)));

//   get timestamp() {
//     return firebase.database.ServerValue.TIMESTAMP;
//   }
//   // send the message to the Backend
//   send = messages => {
//     for (let i = 0; i < messages.length; i++) {
//       const { text, user } = messages[i];
//       const message = {
//         text,
//         user,
//         timestamp: this.timestamp,
//       };
//       this.append(message);
//     }
//   };

//   append = message => this.ref.push(message);

//   // close the connection to the Backend
//   off() {
//     this.ref.off();
//   }
// }

// Fire.shared = new Fire();
// export default Fire;
