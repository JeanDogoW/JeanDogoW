const PromiseRouter = require("express-promise-router");
const db = require("../../../db");
import { Request, Response, Router } from 'express'
import { checkRole } from '../../../authorization/checkRole'
import { requiredFields } from '../../../validation/requiredFields'
import { Action, Resource } from '../../../roleTypes'
import { requiredHeaders } from '../../../validation/requiredHeaders';

const router: Router = new PromiseRouter();

// route path will be appended to end of file structure (v3/data/line-info)
router.post("/",
    requiredFields(['line_data_id', 'request_time']),
    requiredHeaders(['Current-User', 'Authorization']),
    checkRole([{action: Action.CreateAny, resource: Resource.Data}, {action: Action.CreateOwn, resource: Resource.Data}]),
    async (req, res) => {
        const json = req.body;
        const DbRes = await db.query(
            `
                INSERT INTO line_data_info 
                    (line_data_id, description, evac_notice, additional_info, created_by_user_id, last_edited_by_user_id, created_time, last_edited_time)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING line_data_info_id;
            `,
            [
                json["line_data_id"],
                json["description"],
                json["evac_notice"],
                json["additional_info"],
                req.get('Current-User'),
                req.get('Current-User'),
                json["request_time"],
                json["request_time"]
            ],
            2
        );
        if( typeof DbRes !== 'string') {
            return res.json(DbRes.rows[0]);
        } else {
            return res.status(500).send(`Failed to Update Database: ${DbRes}`)
        }
    }
)

// export our router to be mounted by the parent application
export = router