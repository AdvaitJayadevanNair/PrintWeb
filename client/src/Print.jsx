import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { signOut } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { uploadBytes, ref } from 'firebase/storage';

export default function Print({ user, db, storage, auth }) {
    const [file, setFile] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [notification, setNotification] = useState(null);
    const input = useRef(null);

    function submit() {
        if (!file || !user) return;
        setDisabled(true);
        setNotification({ text: 'Processing...', err: false });
        if (file.size > 20 * 1024 * 1024) {
            //20*1024*1024 = 20mb
            setDisabled(false);
            setNotification({ text: 'Max file size is 20mb! Current file size is ' + file.size, err: true });
            return;
        }
        if (file.type !== 'application/pdf') {
            setDisabled(false);
            setNotification({ text: "File must be of type 'application/pdf'! Current file is of type " + file.type, err: true });
            return;
        }
        //add check for page count

        console.log(file, user);
        const uid = uuidv4();
        uploadBytes(ref(storage, uid), file).then(async (snapshot) => {
            console.log('Uploaded PDF to storage!');
            await addDoc(collection(db, 'print'), {
                name: user.displayName,
                email: user.email,
                id: user.email.split('@')[0],
                fileName: file.name,
                fileSize: file.size,
                filePath: uid,
                printStatus: false,
                time: new Date(),
            });
            console.log('Print added to queue!');
            setDisabled(false);
            setNotification({ text: 'Successful! Print added to queue!', err: false });
        });
    }

    function onFileChange(e) {
        setFile(e.target.files[0]);
    }

    return (
        <>
            <section className="section">
                {notification ? (
                    <div className={notification.err ? 'notification is-danger' : 'notification is-primary'}>
                        <button className="delete" onClick={() => setNotification(null)}></button>
                        {notification.text}
                    </div>
                ) : (
                    ''
                )}
                <h1 className="title">Print</h1>
                <h2 className="subtitle">
                    Upload a <strong>PDF</strong> to print below
                </h2>
                <div className="box">
                    <div className="field">
                        <label className="label">PDF Upload</label>
                        <div className="file has-name">
                            <label className="file-label">
                                <input className="file-input" type="file" accept="application/pdf" onChange={onFileChange} />
                                <span className="file-cta">
                                    <span className="file-icon">
                                        <i className="fas fa-upload"></i>
                                    </span>
                                    <span className="file-label">Choose a file???</span>
                                </span>
                                <span className="file-name">{file ? file.name : 'Upload a file'}</span>
                            </label>
                        </div>
                    </div>
                    <div className="field">
                        <button className="button is-primary" disabled={disabled} onClick={submit}>
                            Print
                        </button>
                    </div>
                </div>
                <button className="button is-danger is-outlined" onClick={() => signOut(auth)}>
                    Sign out
                </button>
            </section>

            <footer className="footer">
                <div className="content has-text-centered">
                    <p>
                        ?? 2021 <strong>Advait Jayadevan Nair</strong>. All rights reserved.
                    </p>
                </div>
            </footer>
        </>
    );
}
