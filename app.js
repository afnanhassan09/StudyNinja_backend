const express = require('express');
const dbConnection = require('./config/dbConnection.js');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


dbConnection();


app.use(express.json());


function logRequest(req, res, next) {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
    next();
}

app.use(logRequest);

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,             
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], 
}));




app.get('/', (req, res) => {
    const code = req.query.code;
    if (code) {
        console.log('Authorization Code:', code);
        res.send('Authorization code received. You can close this window.');
    } else {
        res.send('No authorization code found.');
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notification', notificationRoutes);


// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running at ${process.env.BASE_URL || 'http://localhost'}:${PORT}`);
});
