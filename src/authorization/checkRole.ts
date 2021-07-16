import { Request, Response, NextFunction, RequestHandler } from 'express'
import { IScope } from '../roleTypes'
const { roles, get_team_role } = require('../roles')

/**
 * Middleware to check user scopes before forwarding requests on to underlying API funciton
 * @param requiredAccess list of access levels sufficient to use API. If the user has any of the provided scopes, request will pass
 * @returns a RequestHandler object to be injected on a route as middleware before route handling 
 */
export function checkRole(permittedScopes: IScope[]): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        const json = req.body;
        const role = await get_team_role(json["curr_user_id"], json["team_id"]);

        const roleValid = (role != undefined)
        const granted = roleValid && permittedScopes.some(reqScope => roles.can(role)[reqScope.action](reqScope.resource).granted)

        if (granted) {
            return next()
        } else {
            return next()
            // TODO impliment auth
            //return res.status(403).send("Insufficient permissions");
        }
    }
}