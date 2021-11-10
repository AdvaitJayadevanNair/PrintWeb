import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { collection, addDoc } from "firebase/firestore";
import { uploadBytes, ref } from "firebase/storage"

export default function Print({ user, db, storage }) {
    const [disabled, setDisabled] = useState(false);
    const [notification, setNotification] = useState(null);
    const input = useRef(null);


    function submit() {
        if (!input.files || input.files.length == 0 || !user) return;
        setDisabled(true);
        setNotification({ text: "Processing...", err: false });
        const file = input.files[0];
        if (file.size > 20 * 1024 * 1024) { //20*1024*1024 = 20mb
            setDisabled(false);
            setNotification({ text: "Max file size is 20mb! Current file size is " + file.size, err: true });
            return;
        }
        if (file.type !== "application/pdf") {
            setDisabled(false);
            setNotification({ text: "File must be of type 'application/pdf'! Current file is of type " + file.type, err: true });
            return;
        }
        //add check for page count        


        console.log(file, user);
        const uid = uuidv4();
        uploadBytes(ref(storage, uid), file).then(async (snapshot) => {
            console.log('Uploaded PDF to storage!');
            await addDoc(collection(db, "print"), {
                name: user.displayName,
                email: user.email,
                id: user.email.split("@")[0],
                fileName: file.name,
                fileSize: file.size,
                filePath: uid,
                printStatus: false,
            });
            setDisabled(false);
            setNotification({ text: "Successful! Print added to queue!", err: false });
        });
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
                <h1 className="title">Print</h1>
                <h2 className="subtitle">Upload a <strong>PDF</strong> to print below</h2>
                <div className="box">
                    <div className="field">
                        <label className="label">PDF Upload</label>
                        <div className="file has-name">
                            <label className="file-label">
                                <input ref={input} className="file-input" type="file" accept="application/pdf" />
                                <span className="file-cta">
                                    <span className="file-icon">
                                        <i className="fas fa-upload"></i>
                                    </span>
                                    <span className="file-label">Choose a file…</span>
                                </span>
                                <span className="file-name">{input.files ? input.files[0].name : "Upload a file"}</span>
                            </label>
                        </div>
                    </div>
                    <div className="field">
                        <button className="button is-primary" disabled={disabled} onClick={submit}>Print</button>
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
