// const { print, getPrinters } = require('pdf-to-printer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore(app);

const observer1 = db.collection('options').doc('options').onSnapshot(docSnapshot => {
    console.log(`Received doc snapshot: ${docSnapshot}`);
}, err => {
    console.error(`Encountered error: ${err}`);
    throw 'Error connecting to options doc';
});

const observer2 = db.collection('print').where('printStatus', '==', false).onSnapshot(querySnapshot => {
    console.log(`Received query snapshot of size ${querySnapshot.size}`);
}, err => {
    console.error(`Encountered error: ${err}`);
    throw 'Error connecting to print collection';
});

// getPrinters().then((printers) => {
//     db.push("/printers", printers);
// });
// print("public/pdf/" + uuid + ".pdf", {
//     printer: printer.deviceId
// }).then(console.log);