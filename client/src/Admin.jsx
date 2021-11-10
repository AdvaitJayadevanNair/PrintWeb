

export default function Admin({ files }) {
    const [notification, setNotification] = useState(null);
    const [disabled, setDisabled] = useState(false);

    function clearLog(){
        setDisabled(true);
        setNotification({text: "Processing...", err: false});
        axios.post("api/clearLog")
            .then(function(response) {
                setDisabled(false);
                setNotification(response.data)
            })
            .catch(function(error) {
                setDisabled(false);
                console.error(error);
                setNotification({text: "Error!", err: true});
            });
    }

    function reloadPrinters(){
        setDisabled(true);
        setNotification({text: "Processing...", err: false});
        axios.post("api/reloadPrinters")
            .then(function(response) {
                setDisabled(false);
                setNotification(response.data)
            })
            .catch(function(error) {
                setDisabled(false);
                console.error(error);
                setNotification({text: "Error!", err: true});
            });
    }

    return (
        <>
            <Head>
                <title>Synlab Printer Online Portal - Admin</title>
                <meta name="description" content="Synlab Printer Online Portal" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <section class="section">
                {notification ?
                    <div class={notification.err ? "notification is-danger" : "notification is-primary"}>
                        <button class="delete" onClick={() => setNotification(null)}></button>
                        {notification.text}
                    </div>
                    :
                    ""
                }
                <h1 class="title">Admin</h1>
                <h2 class="subtitle">Current printer: <strong>Pritsas</strong></h2>

                <div class="columns">
                    <div class="column">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Student Id</th>
                                    <th>File</th>
                                    <th>Time</th>
                                    <th>Print Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((file) => {
                                    return <tr>
                                        <th>{file.studetId}</th>
                                        <td><a href={file.path} title={file.name}>{file.name}({file.fileSize})</a></td>
                                        <td>{file.time}</td>
                                        <td>{file.printStatus}</td>
                                    </tr>;
                                })}
                                
                            </tbody>
                        </table>
                    </div>
                    <div class="column">
                        <div class="box">
                            <div class="field">
                                <label class="label">Printer</label>
                                <div class="select">
                                    <select>
                                        <option>Select dropdown</option>
                                        <option>With options</option>
                                    </select>
                                </div>
                                <button class="button" disabled={disabled} onClick={reloadPrinters}>
                                    <span className="icon is-medium">
                                        <span class="material-icons-outlined">refresh</span>
                                    </span>
                                </button>
                                
                                                                
                            </div>
                            <button class="button is-primary" disabled={disabled}>Change</button>
                        </div>
                        <div class="box">
                            <div class="field">
                                <label class="label">Log</label>
                                <p className="is-size-4 has-text-danger">This is irrecoverable!</p>
                                <button class="button is-danger" disabled={disabled} onClick={clearLog}>Clear Log</button>
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
