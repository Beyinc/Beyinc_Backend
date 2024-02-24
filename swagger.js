const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Beync Backend',
            version: '1.0.0',
            description: 'API documentation for Beyinc backend',
        },
    },
    apis: ['./routes/*.js'], // Path to your API routes
    basePath: '/',
};

const specs = swaggerJsdoc(options);

module.exports = specs;