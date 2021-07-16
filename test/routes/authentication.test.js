
const request = require('supertest');
const app = require('../../src/app')
const db = require('../../src/db')

jest.mock('../../src/db');

describe('authenticated endpoints', () => {
    it('should not run when not authorized', async () => {
        db.query.mockResolvedValue({rows:[]})
        const response = await request(app).get('/v2/data/get_published_event')
        expect(response.status).toBe(401)
        expect(db.query).toHaveBeenCalledTimes(0)
    })
})
