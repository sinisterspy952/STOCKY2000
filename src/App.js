import React, { useState, useEffect, useContext, createContext } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

// --- 1. FIREBASE CONFIG & INITIALIZATION ---

// Your provided Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCgGB2WYn_JeFyRTJC7ung61l0DmQ6edQc",
    authDomain: "stocky2000-b782b.firebaseapp.com",
    projectId: "stocky2000-b782b",
    storageBucket: "stocky2000-b782b.firebasestorage.app",
    messagingSenderId: "1006195651586",
    appId: "1:1006195651586:web:522b6e146876adb103231b",
    measurementId: "G-GGWGTQN1JR"
};

// Initialize Firebase App and Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firebase AI (Gemini)
// Note: GoogleAIBackend might need to be imported from 'firebase/ai' or 'firebase/vertexai' depending on SDK version
// Assuming it's available as in your provided code snippets.
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });


// --- 2. AUTH CONTEXT & PROVIDER ---

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe; // Cleanup subscription
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);

    const value = { user, loading, login, register, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);


// --- 3. WATCHLIST CONTEXT & PROVIDER ---

const WatchlistContext = createContext();

const WatchlistProvider = ({ children }) => {
    const [watchlist, setWatchlist] = useState(['AAPL', 'MSFT']); // Initial placeholder stocks

    const addStock = (ticker) => {
        const upperTicker = ticker.toUpperCase();
        if (upperTicker && !watchlist.includes(upperTicker)) {
            setWatchlist([...watchlist, upperTicker]);
        }
    };

    const removeStock = (ticker) => {
        setWatchlist(watchlist.filter(t => t !== ticker));
    };

    return (
        <WatchlistContext.Provider value={{ watchlist, addStock, removeStock }}>
            {children}
        </WatchlistContext.Provider>
    );
};

const useWatchlist = () => useContext(WatchlistContext);


// --- 4. NAVIGATION & ROUTING ---

const routes = {
    LOGIN: 'login',
    DASHBOARD: 'dashboard',
    WATCHLIST: 'watchlist',
    PREDICTIONS: 'predictions'
};

const navigate = (path) => {
    window.location.hash = path;
}

const getCurrentRoute = () => {
    return window.location.hash.substring(1) || routes.LOGIN;
}


// --- 5. COMPONENT: NAVIGATION BAR ---

const NavBar = () => {
    const { logout, user } = useAuth();

    if (!user) return null; // Hide navbar if not logged in

    return (
        <nav style={styles.navBar}>
            <button onClick={() => navigate(routes.DASHBOARD)} style={styles.navButton}>🏠 Dashboard</button>
            <button onClick={() => navigate(routes.WATCHLIST)} style={styles.navButton}>⭐ Watchlist</button>
            <button onClick={() => navigate(routes.PREDICTIONS)} style={styles.navButton}>🧠 AI Predictions</button>
            <button onClick={logout} style={{...styles.navButton, ...styles.logoutButton}}>Logout</button>
        </nav>
    );
};


// --- 6. PAGE: LOGIN ---

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegister) {
                await register(email, password);
            } else {
                await login(email, password);
            }
            navigate(routes.DASHBOARD);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={styles.pageContainer}>
            <h2 style={styles.header}>💰 Stock Tracker Login</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    style={styles.input}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    style={styles.input}
                />
                <button type="submit" style={styles.primaryButton}>
                    {isRegister ? 'Register' : 'Login'}
                </button>
            </form>
            {error && <p style={styles.errorText}>{error}</p>}
            <button onClick={() => setIsRegister(!isRegister)} style={styles.textButton}>
                {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
        </div>
    );
};


// --- 7. PAGE: DASHBOARD ---

const DashboardPage = () => {
    const { user } = useAuth();
    const { watchlist } = useWatchlist();

    return (
        <div style={styles.pageContainer}>
            <h2 style={styles.header}>📈 Dashboard</h2>
            <p>Welcome back, **{user?.email || 'User'}**!</p>
            <div style={styles.card}>
                <h3>Your Watchlist Summary</h3>
                <p>You are currently tracking **{watchlist.length}** stocks.</p>
                <button onClick={() => navigate(routes.WATCHLIST)} style={styles.primaryButton}>Go to Watchlist</button>
            </div>
            <div style={styles.card}>
                <h3>Market News (Placeholder)</h3>
                <p>Top Market Story: Placeholder news item...</p>
            </div>
        </div>
    );
};


// --- 8. PAGE: WATCHLIST ---

const WatchlistPage = () => {
    const [newStock, setNewStock] = useState('');
    const { watchlist, addStock, removeStock } = useWatchlist();

    const handleAdd = (e) => {
        e.preventDefault();
        addStock(newStock);
        setNewStock('');
    };

    return (
        <div style={styles.pageContainer}>
            <h2 style={styles.header}>⭐ Stock Watchlist</h2>

            <form onSubmit={handleAdd} style={styles.inputGroup}>
                <input
                    type="text"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="Enter Stock Ticker (e.g., TSLA)"
                    required
                    style={styles.input}
                />
                <button type="submit" style={styles.primaryButton}>Add Stock</button>
            </form>

            <ul style={styles.list}>
                {watchlist.length === 0 ? (
                    <li style={styles.listItem}>Your watchlist is empty.</li>
                ) : (
                    watchlist.map((stock) => (
                        <li key={stock} style={styles.listItem}>
                            **{stock}**
                            <button onClick={() => removeStock(stock)} style={styles.removeButton}>Remove</button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};


// --- 9. PAGE: AI PREDICTIONS ---

const PredictionsPage = () => {
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPredictions = async () => {
        setLoading(true);
        setError(null);
        try {
            const prompt = `
                I need a JSON object for stock market predictions.
                The object must have two properties: "bullish" and "bearish".
                "bullish" should be an array of 10 stock ticker symbols that are predicted to go up.
                "bearish" should be an array of 10 stock ticker symbols that are predicted to go down.
                These should be **simulated** predictions, as I know you don't have real-time access.
                Ensure the response is ONLY the raw JSON object, without any surrounding text or markdown, for easy parsing.
            `;

            const result = await model.generateContent({
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            // The result.text() should be a JSON string as requested in the prompt
            const jsonText = result.text.trim();
            const data = JSON.parse(jsonText);
            setPredictions(data);

        } catch (err) {
            console.error("Gemini API Error:", err);
            setError("Failed to fetch predictions. Check console for details.");
            // Set a simulated fallback data in case of parsing error
            setPredictions({
                bullish: ['SIM1', 'SIM2', 'SIM3', 'SIM4', 'SIM5', 'SIM6', 'SIM7', 'SIM8', 'SIM9', 'SIM10'],
                bearish: ['DUM1', 'DUM2', 'DUM3', 'DUM4', 'DUM5', 'DUM6', 'DUM7', 'DUM8', 'DUM9', 'DUM10'],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!predictions) {
            fetchPredictions();
        }
    }, []);

    return (
        <div style={styles.pageContainer}>
            <h2 style={styles.header}>🧠 AI Stock Predictions</h2>
            <p>These predictions are **simulated** by the Gemini AI for demonstration purposes.</p>

            {loading && <p>Loading AI Predictions... Please wait.</p>}
            {error && <p style={styles.errorText}>Error: {error}</p>}

            {predictions && (
                <div style={styles.predictionsGrid}>
                    <div style={styles.predictionsColumn}>
                        <h3 style={styles.bullishHeader}>Bullish (Predicted Up) ⬆️</h3>
                        <ul style={styles.predictionList}>
                            {predictions.bullish.map((stock, index) => (
                                <li key={index} style={styles.predictionItem}>
                                    **{stock}**
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={styles.predictionsColumn}>
                        <h3 style={styles.bearishHeader}>Bearish (Predicted Down) ⬇️</h3>
                        <ul style={styles.predictionList}>
                            {predictions.bearish.map((stock, index) => (
                                <li key={index} style={styles.predictionItem}>
                                    **{stock}**
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <button onClick={fetchPredictions} disabled={loading} style={styles.secondaryButton}>
                {loading ? 'Refreshing...' : 'Refresh Predictions'}
            </button>
        </div>
    );
};


// --- 10. MAIN APP COMPONENT ---

const App = () => {
    const { user, loading } = useAuth();
    const [currentRoute, setCurrentRoute] = useState(getCurrentRoute());

    // Effect to handle browser hash changes (simple client-side routing)
    useEffect(() => {
        const handleHashChange = () => {
            setCurrentRoute(getCurrentRoute());
        };

        window.addEventListener('hashchange', handleHashChange);
        // Ensure user is redirected immediately upon login/logout
        if (!user && currentRoute !== routes.LOGIN) {
            navigate(routes.LOGIN);
        } else if (user && currentRoute === routes.LOGIN) {
            navigate(routes.DASHBOARD);
        }

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [user, currentRoute]);

    const renderPage = () => {
        if (loading) return <div>Loading...</div>;

        if (!user) {
            return <LoginPage />;
        }

        switch (currentRoute) {
            case routes.DASHBOARD:
                return <DashboardPage />;
            case routes.WATCHLIST:
                return <WatchlistPage />;
            case routes.PREDICTIONS:
                return <PredictionsPage />;
            default:
                // Default to dashboard if logged in but on an invalid route
                navigate(routes.DASHBOARD);
                return <DashboardPage />;
        }
    };

    return (
        <div style={styles.appContainer}>
            <NavBar />
            <div style={styles.contentContainer}>
                {renderPage()}
            </div>
        </div>
    );
};

// --- 11. STYLES (Minimal CSS-in-JS) ---

const styles = {
    appContainer: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#f9f9f9',
    },
    contentContainer: {
        padding: '20px',
    },
    pageContainer: {
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '6px',
        minHeight: '400px',
    },
    header: {
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px',
        marginBottom: '20px',
        color: '#333',
    },
    // Navigation
    navBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#007bff',
        padding: '10px 20px',
        borderRadius: '6px 6px 0 0',
    },
    navButton: {
        backgroundColor: 'transparent',
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.3s',
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        borderRadius: '4px',
    },
    // Form & Input
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '15px',
    },
    input: {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '16px',
    },
    primaryButton: {
        padding: '10px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.3s',
    },
    secondaryButton: {
        padding: '10px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        marginTop: '20px',
    },
    textButton: {
        backgroundColor: 'transparent',
        color: '#007bff',
        border: 'none',
        cursor: 'pointer',
        marginTop: '10px',
        fontSize: '14px',
    },
    errorText: {
        color: '#dc3545',
        fontWeight: 'bold',
        marginTop: '10px',
    },
    // Watchlist styles
    inputGroup: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
    },
    list: {
        listStyle: 'none',
        padding: 0,
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        marginBottom: '5px',
        borderRadius: '4px',
    },
    removeButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    // Prediction styles
    predictionsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px',
    },
    predictionsColumn: {
        backgroundColor: '#f1f1f1',
        padding: '15px',
        borderRadius: '6px',
    },
    bullishHeader: {
        color: '#28a745',
        borderBottom: '1px solid #28a745',
        paddingBottom: '5px',
    },
    bearishHeader: {
        color: '#dc3545',
        borderBottom: '1px solid #dc3545',
        paddingBottom: '5px',
    },
    predictionList: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        marginTop: '10px',
    },
    predictionItem: {
        marginBottom: '5px',
    },
    card: {
        backgroundColor: '#e9ecef',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '15px',
    }
};

// --- 12. RENDER THE APP ---

// The standard way to render the app in a single file environment (like a CodeSandbox or local index.html)
// Note: In a standard React setup, you'd use 'ReactDOM.createRoot(document.getElementById('root')).render(<AppWrapper />);'
// For simplicity in this single-file output, we'll wrap the main App component in the providers.

const AppWrapper = () => (
    <AuthProvider>
        <WatchlistProvider>
            <App />
        </WatchlistProvider>
    </AuthProvider>
);

// Export the wrapper for rendering (this is how you would use it in your index.js file)
export default AppWrapper;
