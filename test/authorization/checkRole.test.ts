import { Request, Response } from 'express'
import { checkRole } from '../../src/authorization/checkRole'
import { Action, Resource } from '../../src/roleTypes'
const db = require('../../src/db')

jest.mock('../../src/db');

describe('checkRole', () => {
    // TODO: uncomment once we reinstate auth
    // it('should return 403 when user does not have access', async () => {
    //     db.query.mockResolvedValue({rows:[{user_approved: 1, admin_approved: 1, access: 2}]})
    //     const resFunction = checkRole([{action: Action.CreateAny, resource: Resource.Data}])
    //     var status = null
    //     const response = {status: (val: number) => {
    //             status = val
    //             return {send: () => null}
    //         }
    //     }
    //     await resFunction(
    //         {body: {curr_user_id: "user", user: "user"}} as Request,
    //         response as unknown as Response,
    //         () => fail()
    //     )
    //     expect(status).toBe(403)
    // })

    // it('should return 403 when user access is not approved', async () => {
    //     db.query.mockResolvedValue({rows:[{user_approved: 1, admin_approved: 0, access: 0}]})
    //     const resFunction = checkRole([{action: Action.CreateAny, resource: Resource.Data}])
    //     var status = null
    //     const response = {status: (val: number) => {
    //             status = val
    //             return {send: () => null}
    //         }
    //     }
    //     await resFunction(
    //         {body: {curr_user_id: "user", user: "user"}} as Request,
    //         response as unknown as Response,
    //         () => fail()
    //     )
    //     expect(status).toBe(403)
    // })

    it('should pass when current user has access', async () => {
        db.query.mockResolvedValue({rows:[{user_approved: 1, admin_approved: 1, access: 0}]})
        const resFunction = checkRole([{action: Action.CreateAny, resource: Resource.Data}])
        var status = null
        var passed = false
        const response = {status: (val: number) => {
                status = val
                return {send: () => null}
            }
        }
        await resFunction(
            {body: {curr_user_id: "user", user: "user"}} as Request,
            response as unknown as Response,
            () => passed = true
        )
        expect(status).toBeNull
        expect(passed).toEqual(true)
    })
})
