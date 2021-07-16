import { Request, Response, NextFunction, RequestHandler } from 'express'
import { requiredFields } from '../../src/validation/requiredFields'
const db = require('../../src/db')

jest.mock('../../src/db');

describe('requiredFields', () => {
    it('should call next() when fields are present', () => {
        const resFunction = requiredFields(["name", "secondField"])

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
            {body: {name: "user", secondField: "value"}} as Request,
            response as unknown as Response,
            () => nextWasCalled = true
        )
        expect(statusSet).toEqual(0)
        expect(sendWasCalled).toEqual(false)
        expect(nextWasCalled).toEqual(true)
    })
    it('should return 400 when fields are not present', () => {
        const resFunction = requiredFields(["name", "secondField"])

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
            {body: {name: "user", secondField: ""}} as Request,
            response as unknown as Response,
            () => nextWasCalled = true
        )
        expect(statusSet).toEqual(400)
        expect(sendWasCalled).toEqual(true)
        expect(nextWasCalled).toEqual(false)
    })
})
