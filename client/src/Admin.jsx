import { useState, useEffect } from 'react';
import { signOut } from "firebase/auth";
import { doc, collection, query, onSnapshot, updateDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

function humanFileSize(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}

export default function Admin({ db, storage, auth }) {
    const [docs, setDocs] = useState(null);
    const [options, setOptions] = useState(null);
    const [notification, setNotification] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [printer, setPrinter] = useState(null);

    useEffect(() => {
        const q1 = query(collection(db, "print"));
        const q3 = query(doc(db, "options", "options"));
        const unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
            const docs = [];
            querySnapshot.forEach((doc) => {
                docs.push(doc.data());
            });
            setDocs(docs);
        });
        const unsubscribe3 = onSnapshot(q3, (doc) => {
            setOptions(doc.data());
        });
        return () => {
            unsubscribe1();
            unsubscribe3();
        };
    }, [])

    function clearLog() {
        // setDisabled(true);
        setNotification({ text: "This does not currently work!", err: true });
        //ToDo
    }

    async function reloadPrinters() {
        setDisabled(true);
        setNotification({ text: "Processing...", err: false });

        await updateDoc(doc(db, "options", "options"), {
            getPrinters: true,
        });

        setDisabled(false);
        setNotification({ text: "Successful! This will take a few mins to show up!", err: false });
    }

    function printerChange(e) {
        setPrinter(e.target.value);
    }

    async function changePrinter() {
        if (!printer) return;
        setDisabled(true);
        setNotification({ text: "Processing...", err: false });

        await updateDoc(doc(db, "options", "options"), {
            name: options.printers[printer].name,
            deviceId: options.printers[printer].deviceId
        });

        setDisabled(false);
        setNotification({ text: "Printer changed!", err: false });
    }

    function dateToTimestamp(date) {
        console.log(date);
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let year = date.getFullYear();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${month}/${day}/${year} ${hours}:${minutes}${ampm}`;
    }

    async function redirectToFile(path) {
        let file = ref(storage, path);
        let url = await getDownloadURL(file);
        window.open(url, '_blank').focus();
    }

    if (!docs || !options) {
        return <div>fancy loading screen...🙂</div>
    }

    return (
        <>
            <section className="section">
                {notification ?
                    <div className={notification.err ? "notification is-danger" : "notification is-primary"}>
                        <button className="delete" onClick={() => setNotification(null)}></button>
                        {notification.text}
                    </div>
                    :
                    ""
                }
                <h1 className="title">Admin</h1>
                <h2 className="subtitle">Current printer: <strong className={options.deviceId ? "" : "has-text-danger"}>{options.deviceId ? options.deviceId : "Not Set"}</strong></h2>

                <div className="columns">
                    <div className="column">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>File</th>
                                    <th>Upload Time</th>
                                    <th>Print Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map((doc, index) => {
                                    return <tr key={index}>
                                        <th>{doc.name}({doc.id})</th>
                                        <td><a href="#" title={doc.fileName} onClick={() => redirectToFile(doc.filePath)}>{doc.fileName}({humanFileSize(doc.fileSize)})</a></td>
                                        <td>{dateToTimestamp(doc.time.toDate())}</td>
                                        <td>{doc.printStatus ? "Printed" : "In queue"}</td>
                                    </tr>;
                                })}

                            </tbody>
                        </table>
                    </div>
                    <div className="column">
                        <div className="box">
                            <div className="field">
                                <label className="label">Printer</label>
                                <div className="select">
                                    <select defaultValue="" onChange={printerChange}>
                                        <option value="" disabled>Select Printer</option>
                                        {options.printers.map((printer, index) => {
                                            return <option key={index} value={index}>{printer.name}</option>;
                                        })}
                                    </select>
                                </div>
                                <button className="button" disabled={disabled} onClick={reloadPrinters}>
                                    <span className="icon is-medium">
                                        <span className="material-icons-outlined">refresh</span>
                                    </span>
                                </button>
                            </div>
                            <button className="button is-primary" disabled={disabled} onClick={changePrinter}>Change</button>
                        </div>
                        <div className="box">
                            <div className="field">
                                <label className="label">Log</label>
                                <p className="is-size-4 has-text-danger">This is irrecoverable!</p>
                                <button className="button is-danger" disabled={disabled} onClick={clearLog}>Clear Log</button>
                            </div>
                        </div>
                        <div className="box">
                            <div className="field">
                                <button className="button is-danger is-outlined" onClick={() => signOut(auth)}>Sign out</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="content has-text-centered">
                    <p>© 2021 <strong>Advait Jayadevan Nair</strong>. All rights reserved.</p>
                </div>
            </footer>
        </>
    )
}