const request = require('supertest');
const app = require('./server'); // Adjust path to your server file
const pool = require('./database'); // Adjust path to your database setup

describe('User Registration API', () => {
    beforeAll(async () => {
        // Clear the users table before testing
        await pool.query('DELETE FROM users');
    });

    afterAll(async () => {
        // Close the database connection after testing
        await pool.end();
    });

    test('Should register a new user successfully', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'password123',
                email: 'testemail@example.com',
            });

        expect(response.status).toBe(201);
        expect(response.text).toBe('User registered successfully!');
    });

    test('Should not allow duplicate username', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'password123',
                email: 'newemail@example.com',
            });

        expect(response.status).toBe(400);
        expect(response.text).toBe('Username already exists. Please choose a different username.');
    });

    test('Should not allow duplicate email', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'newuser',
                password: 'password123',
                email: 'testemail@example.com',
            });

        expect(response.status).toBe(400);
        expect(response.text).toBe('Email already registered. Please use a different email.');
    });
});
