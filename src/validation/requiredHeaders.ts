import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Middleware to check required headers before forwarding requests on to underlying API function. Only checks for existence
 * @param fields fields to check
 * @returns a RequestHandler object to be injected on a route as middleware before route handling 
 */
export function requiredHeaders (fields: string[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        if(fields.every(field => req.get(field) != undefined)){
            return next()
        } else {
            return res.status(400).send('missing required headers')
        }
    }
}
