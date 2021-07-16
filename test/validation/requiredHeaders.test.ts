import { Request, Response } from 'express'
import { requiredHeaders } from '../../src/validation/requiredHeaders'
const db = require('../../src/db')

jest.mock('../../src/db');

describe('requiredFields', () => {
    it('should call next() when fields are present', () => {
        const resFunction = requiredHeaders(["Current-User", "Second-Header"])

        var nextWasCalled = false
        var statusSet = 0
        var sendWasCalled = false
        const response = {
            status: (val: number) => {
                statusSet = val
                return response
            },
            send: () => sendWasCalled = true
        }
        resFunction(
            {get: () => "value"} as unknown as Request,
            response as unknown as Response,
            () => nextWasCalled = true
        )
        expect(statusSet).toEqual(0)
        expect(sendWasCalled).toEqual(false)
        expect(nextWasCalled).toEqual(true)
    })
    it('should return 400 when fields are not present', () => {
        const resFunction = requiredHeaders(["Current-User", "Second-Header"])

        var nextWasCalled = false
        var statusSet = 0
        var sendWasCalled = false
        const response = {
            status: (val: number) => {
                statusSet = val
                return response
            },
            send: () => sendWasCalled = true
        }
        resFunction(
            {get: () => undefined} as unknown as Request,
            response as unknown as Response,
            () => nextWasCalled = true
        )
        expect(statusSet).toEqual(400)
        expect(sendWasCalled).toEqual(true)
        expect(nextWasCalled).toEqual(false)
    })
})
