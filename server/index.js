const fs = require('fs');
const { print, getPrinters } = require('pdf-to-printer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const serviceAccount = require('./serviceAccountKey.json');

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'printerweb-be549.appspot.com',
});
const db = getFirestore(app);
const bucket = getStorage().bucket();
let options = null;
let gettingPrinters = false;
let sent = {};

console.log('\x1b[36mPrintWeb Worker Started!\x1b[0m');

db.collection('options')
    .doc('options')
    .onSnapshot(
        (docSnapshot) => {
            console.log(`[LOG][OPTIONS]Changes detected!`);
            let temp = docSnapshot.data();
            if (options && options.name !== temp.name) {
                console.log(`[LOG][OPTIONS]\x1b[34mPrinter changed to ${options.name}!\x1b[0m`);
            }
            options = temp;
            if(!options.name || !options.deviceId){
                console.log(`[LOG][OPTIONS]\x1b[31mPrinter to use has not been defined!\x1b[0m`);
            }
            if (!gettingPrinters && options.getPrinters) {
                gettingPrinters = true;
                console.log(`[LOG][OPTIONS]\x1b[33mGetting printers!\x1b[0m`);
                db.collection('options').doc('options').update({
                    getPrinters: false,
                });
                getPrinters().then((printers) => {
                    db.collection('options').doc('options').update({
                        printers,
                    });
                    console.log(`[LOG][OPTIONS]\x1b[32mFound Printers:\x1b[0m`);
                    printers.forEach((printer, index) => {
                        console.log(`[LOG][OPTIONS]${index + 1}. ${printer.deviceId}`);
                    });
                    gettingPrinters = false;
                });
            }
        },
        (err) => {
            console.error(`\x1b[31mEncountered error: ${err}\x1b[0m`);
            throw 'Error connecting to options doc';
        }
    );

db.collection('print')
    .where('printStatus', '==', false)
    .onSnapshot(
        (querySnapshot) => {
            console.log(`[LOG][PRINT]Found ${querySnapshot.size} pdfs to print!`);
            querySnapshot.forEach(async (doc) => {
                if (!sent[doc.id]) {
                    sent[doc.id] = true;
                    let data = doc.data();
                    console.log(`[LOG][PRINT]\x1b[33mDownloading ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${data.name}!\x1b[0m`);
                    await bucket.file(data.filePath).download({
                        destination: 'temp/' + data.filePath + '.pdf',
                    });
                    console.log(`[LOG][PRINT]\x1b[32mDownloaded ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${data.name}!\x1b[0m`);
                    if (!options || !options.deviceId) {
                        console.error(
                            `[LOG][PRINT]\x1b[31mFailed to print ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${
                                data.name
                            }! Error due to no printer selected!\x1b[0m`
                        );
                        return;
                    }
                    print('temp/' + data.filePath + '.pdf', {
                        printer: options.deviceId,
                    })
                        .then(async () => {
                            console.log(`[LOG][PRINT]\x1b[32mPrinting ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${data.name}!\x1b[0m`);
                            console.log(
                                `[LOG][PRINT]\x1b[33mSetting ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${data.name} to printed!\x1b[0m`
                            );
                            await doc.ref.update({
                                printStatus: true,
                            });
                            console.log(`[LOG][PRINT]\x1b[32mSet ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${data.name} to printed!\x1b[0m`);
                            console.log(
                                `[LOG][PRINT]\x1b[33mDeleting local file ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${data.name}!\x1b[0m`
                            );
                            fs.unlink('temp/' + data.filePath + '.pdf', (err) => {
                                if (err) {
                                    console.log(
                                        `[LOG][PRINT]\x1b[31mDeleting local file ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${
                                            data.name
                                        } failed!\x1b[0m`
                                    );
                                    console.error(err);
                                    return;
                                }
                                console.log(
                                    `[LOG][PRINT]\x1b[32mDeleted local file ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${data.name}!\x1b[0m`
                                );
                            });
                        })
                        .catch((err) => {
                            console.error(
                                `[LOG][PRINT]\x1b[31mFailed to print ${data.fileName}(${humanFileSize(data.fileSize)}) sent by ${
                                    data.name
                                }! Error due to printer selected not valid or pdf-to-printer error!\x1b[0m`
                            );
                            console.error(err);
                        });
                }
            });
        },
        (err) => {
            console.error(`\x1b[31mEncountered error: ${err}\x1b[0m`);
            throw 'Error connecting to print collection';
        }
    );

function humanFileSize(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return bytes.toFixed(dp) + ' ' + units[u];
}
