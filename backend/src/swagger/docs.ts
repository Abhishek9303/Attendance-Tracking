export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Attendance Management API',
    version: '1.0.0',
    description: 'Production-ready full-stack attendance manager system endpoints',
  },
  servers: [
    {
      url: 'http://localhost:5001',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a new employee or admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['USER', 'ADMIN'] },
                },
                required: ['name', 'email', 'phone', 'password'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration success' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in to secure account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
        },
      },
    },
    '/api/attendance/mark': {
      post: {
        summary: 'Submit employee daily attendance request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  selfieUrl: { type: 'string' },
                },
                required: ['latitude', 'longitude', 'selfieUrl'],
              },
            },
          },
        },
        responses: {
          210: { description: 'Mark submission success' },
        },
      },
    },
    '/api/admin/dashboard': {
      get: {
        summary: 'Get admin counts and charts summary',
        responses: {
          200: { description: 'Dashboard stats payload' },
        },
      },
    },
  },
};
