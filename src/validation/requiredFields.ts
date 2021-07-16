import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Middleware to check required body fields before forwarding requests on to underlying API function. Only checks for existence
 * @param fields fields to check
 * @returns a RequestHandler object to be injected on a route as middleware before route handling 
 */
export function requiredFields (fields: string[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const json = req.body;
        if(fields.every(field => json[field] && json[field].length !== 0)){
            return next()
        } else {
            return res.status(400).send("missing required field")
        }
    }
}
