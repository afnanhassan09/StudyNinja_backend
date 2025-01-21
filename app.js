const express = require('express');
const dbConnection = require('./config/dbConnection.js');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


dbConnection();


app.use(express.json());
app.use(cors());


const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Essay Review API',
            version: '1.0.0',
            description: 'API documentation for Essay Review Platform',
            contact: {
                name: 'Support Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:9001',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http', // Correct type for OpenAPI 3.0 bearer tokens
                    scheme: 'bearer',
                    bearerFormat: 'JWT', // Optional, but indicates the token format
                    description: 'Enter JWT token in the format: Bearer <token>',
                },
            },
        },
        security: [
            {
                bearerAuth: [], // Applies globally to all endpoints
            },
        ],
    },
    apis: ['./routes/*.js'], // Adjust the path to your route files
};


const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.get('/', (req, res) => {
    res.send('Welcome to Essay Review API');
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
