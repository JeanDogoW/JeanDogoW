const PromiseRouter = require("express-promise-router");
import db = require("../../../db");
import { Request, Response, Router } from 'express'
import { checkRole } from '../../../authorization/checkRole'
import { requiredFields } from '../../../validation/requiredFields'
import { Action, Resource } from '../../../roleTypes'
import { requiredHeaders } from '../../../validation/requiredHeaders';

const router: Router = new PromiseRouter();

// route path will be appended to end of file structure (v3/data/polygon)
router.post("/",
    requiredFields(['name', 'request_time']),
    requiredHeaders(['Current-User', 'Authorization']),
    checkRole([{action: Action.CreateAny, resource: Resource.Data}, {action: Action.CreateOwn, resource: Resource.Data}]),
    async (req, res) => {
        const json = req.body;
        const DbRes = await db.query(
            `
                INSERT INTO polygon_data
                    (gis_position, name, location, team_id, created_by_user_id, last_edited_by_user_id, created_time, last_edited_time, data_visibility, polygon_data_type)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING polygon_data_id;
            `,
            [
                json["gis_position"],
                json["name"],
                json["location"],
                json["team_id"],
                req.get('Current-User'),
                req.get('Current-User'),
                json["request_time"],
                json["request_time"],
                json["data_visibility"],
                json["polygon_data_type"]
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

router.put("/",
    requiredFields(['name', 'request_time']),
    requiredHeaders(['Current-User', 'Authorization']),
    checkRole([{action: Action.CreateAny, resource: Resource.Data}, {action: Action.CreateOwn, resource: Resource.Data}]),
    async (req, res) => {
        const json = req.body;
        const DbRes = await db.query(
            `
                UPDATE polygon_data
                SET (gis_position, name, location, team_id, last_edited_by_user_id, last_edited_time, data_visibility, polygon_data_type)
                    = ($2, $3, $4, $5, $6, $7, $8, $9)
                WHERE polygon_data_id = $1;
            `,
            [
                json["polygon_data_id"],
                json["gis_position"],
                json["name"],
                json["location"],
                json["team_id"],
                req.get('Current-User'),
                json["request_time"],
                json["data_visibility"],
                json["polygon_data_type"]
            ],
            2
        );
        if( typeof DbRes !== 'string') {
            res.sendStatus(200)
        } else {
            return res.status(500).send(`Failed to Update Database: ${DbRes}`)
        }
    }
)

router.get("/",
    requiredHeaders(['Current-User', 'Authorization']),
    checkRole([{action: Action.ReadAny, resource: Resource.Data}]),
    async (req, res) => {
        const json = req.body;
        const DbRes = await db.query(
            `
                SELECT
                    polygon_data_id,
                    ST_AsText(gis_position),
                    name,
                    location,
                    team_id,
                    created_by_user_id,
                    last_edited_by_user_id,
                    created_time,
                    last_edited_time,
                    data_visibility,
                    polygon_data_type,
                    (
                        SELECT row_to_json(x) FROM
                        (
                            SELECT
                                polygon_data_info_id,
                                polygon_data_id,
                                description,
                                evac_notice,
                                additional_info,
                                created_by_user_id,
                                last_edited_by_user_id,
                                created_time,
                                last_edited_time
                            FROM polygon_data_info
                            WHERE 
                                polygon_data_info.polygon_data_id = polygon_data.polygon_data_id AND
                                last_edited_time = (SELECT MAX(last_edited_time) FROM polygon_data_info WHERE polygon_data_info.polygon_data_id = polygon_data.polygon_data_id)
                            LIMIT 1
                        ) AS x
                    ) AS polygon_data_info
                FROM
                    polygon_data
            `,
            [],
            2
        );
        if( typeof DbRes !== 'string') {
            return res.json(DbRes.rows);
        } else {
            return res.status(500).send(`Failed to Update Database: ${DbRes}`)
        }
    }
)

router.patch("/:attr",
    requiredFields(["new_data", "request_time", "polygon_data_id"]),
    requiredHeaders(['Current-User', 'Authorization']),
    checkRole([{action: Action.UpdateAny, resource: Resource.Data}, {action: Action.UpdateOwn, resource: Resource.Data}]),
    async (req, res) => {
        const json = req.body;
        const attr = req.params.attr;

        const allowedAttributes = ["gis_position", "name", "location", "team_id", "data_visibility", "polygon_data_type"]
        if(allowedAttributes.indexOf(attr) < 0) {
            res.status(400).send(`Cannot update field: ${attr}`)
        }

        const DbRes = await db.query(
            `
                UPDATE polygon_data 
                SET ${attr} = $1, last_edited_by_user_id = $2, last_edited_time = $3
                WHERE polygon_data_id = $4;        
            `,
            [
                json["new_data"],
                req.get('Current-User'),
                json["request_time"],
                json["polygon_data_id"]
            ],
            2
        )

        if( typeof DbRes !== 'string') {
            res.sendStatus(200)
        } else {
            res.status(500).send(`Failed to Update Database: ${DbRes}`)
        }
  }
)

// export our router to be mounted by the parent application
export = router