import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export default function Login({ auth }) {
    function login() {
        signInWithPopup(auth, provider);
    }

    return (
        <>
            <section className="section">
                <h1 className="title">Login</h1>
                <div className="box">
                    <div className="field">
                        <button className="button is-primary" onClick={login}>
                            Login
                        </button>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="content has-text-centered">
                    <p>
                        © 2021 <strong>Advait Jayadevan Nair</strong>. All rights reserved.
                    </p>
                </div>
            </footer>
        </>
    );
}
