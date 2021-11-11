const { print, getPrinters } = require('pdf-to-printer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const serviceAccount = require('./serviceAccountKey.json');

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: "printerweb-be549.appspot.com"
});
const db = getFirestore(app);
const bucket = getStorage().bucket();

let options = null;
let sent = {};


const observer1 = db.collection('options').doc('options').onSnapshot(docSnapshot => {
    console.log(`Received doc snapshot: ${docSnapshot}`);
    options = docSnapshot.data();

    if (options.getPrinters) {
        db.collection('options').doc('options').update({
            getPrinters: false,
        });
        getPrinters().then((printers) => {
            db.collection('options').doc('options').update({
                printers
            });
        });
    }
}, err => {
    console.error(`Encountered error: ${err}`);
    throw 'Error connecting to options doc';
});

const observer2 = db.collection('print').where('printStatus', '==', false).onSnapshot(querySnapshot => {
    console.log(`Received query snapshot of size ${querySnapshot.size}`);
    if (!options || !options.deviceId) return;
    querySnapshot.forEach(async doc => {
        if (!sent[doc.id]) {
            sent[doc.id] = true;
            let data = doc.data();
            console.log(`Printing ${data.name} file ${data.fileName}`);
            await bucket.file(data.filePath).download({
                destination: "temp/" + data.filePath + ".pdf"
            })
            print("temp/" + data.filePath + ".pdf", {
                printer: options.deviceId
            }).then(console.log);
        }
    });
}, err => {
    console.error(`Encountered error: ${err}`);
    throw 'Error connecting to print collection';
});
