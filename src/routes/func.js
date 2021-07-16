const Router = require("express-promise-router");
const db = require("../db");
// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router();
// export our router to be mounted by the parent application
module.exports = router;

const { roles, get_team_role } = require('../roles')

router.post("/upsert_task", async (req, res) => {
    // let lng = req.body["lng"];
    // let lat = req.body["lat"];
    // let position 
    // if (lng && lat){
    //     console.log("inserting")
    //    position = `POINT(${lng} ${lat})`
    // }
    let [id, name, description, status, team, tenant, period, supervisor, position, created_by]
    = [req.body["id"], req.body["name"], req.body["description"], req.body["status"], req.body["team"], req.body["tenant"],
    req.body["period"], req.body["supervisor"], req.body["position"], req.body["created_by"]]
    let {rows} = await db.query(
    `
    INSERT INTO task (id, name, description, status, team, tenant, period, supervisor, position, assigned_to, created_by)
    VALUES (COALESCE($1, (select nextval('task_id_seq'))), $2, $3, $4, $5, $6, $7, $8, $9, DEFAULT, $10)
    on conflict (id)
    do update set (name, description, status, team, tenant, period, supervisor, position) = ($2, $3, $4, $5, $6, $7, $8, $9) 
    where task.id = $1
    RETURNING task.id;`,
    [id, name, description, status, team, tenant, period, supervisor, position, created_by]
    );
    res.json(rows[0]);
});

router.post("/assign_task", async (req, res) => {
    [user_id, task_id] = [req.body["user_id"], req.body["task_id"]]
    db.query(
    `UPDATE task 
    SET assigned_to = array_append(assigned_to, $1)  
    WHERE task.id = $2;`,
    [user_id, task_id]
    );
    db.query(
    `UPDATE user_state 
    SET task = array_append(task, $2)   
    WHERE user_state.user_id = $1;`,
    [user_id, task_id]
    );
    res.end();
});

router.post("/unassign_task", async (req, res) => {
    [user_id, task_id] = [req.body["user_id"], req.body["task_id"]]
    db.query(
    `UPDATE task 
    SET assigned_to = array_remove(assigned_to, $1)  
    WHERE task.id = $2;`,
    [user_id, task_id]
    );
    db.query(
    `UPDATE user_state 
    SET task = array_remove(task, $2)   
    WHERE user_state.user_id = $1;`,
    [user_id, task_id]
    );
    res.end();
});

router.get("/get_task", async (req, res) => {
    const { rows } = await db.query(
    `SELECT *, ST_asText(position) as position FROM public.task;`
    );
    res.json(rows)
});


//team management APIs

//create a new team by user - return status 201 and location of resource!
// no permissioning check required for creating a team entry
router.post("/team", async (req, res) => {
    [user_id, name, access, description] = 
    [req.body["user_id"], req.body["name"], req.body["access"], req.body["description"]]
    const {rows} = await db.query(
        `INSERT INTO public.team(name, access, description)
        VALUES ($1, $2, $3)
        RETURNING id;`,
    [name, access, description]
    );

    team_id = rows[0]["id"]
    db.query(
    `INSERT INTO public.user_team_join(
    user_id, team_id, access, user_approved, admin_approved)
    VALUES ($1, $2, 1, 1, 1);`,
    [user_id, team_id]
    );

    const location = req.path + '/' + team_id;
    res.location(location).status(201).end();
});

// get all teams
router.get("/team", async (req, res) => {
    // any user can read team info
    const { rows } = await db.query(
    `SELECT * FROM public.team;`
    );
    res.json(rows)
});

// get team by id
router.get("/team/:team_id", async (req, res) => {
    [team_id] = [req.params["team_id"]];
    const { rows } = await db.query(
        `SELECT * FROM public.team
        WHERE id = $1;`,
        [team_id]
    );
    res.json(rows)
});

//modify an existing team
router.put("/team/:team_id", async(req, res) => {
    [curr_user_id, name, access, description] = //user_id is temporary until we get auth0 identities
    [req.body["curr_user_id"], req.params["team_id"], req.body["name"], req.body["access"], req.body["description"]]
    
    const role = await get_team_role(curr_user_id, team_id);
    const granted = role != undefined && // user must be a member of the team
                    (roles.can(role)["updateOwn"]("team").granted || // admin of this team
                    roles.can(role)["updateAny"]("team").granted); // superuser exception

    if (granted) {
        const {rows} = await db.query(
            `UPDATE public.team
            SET name = COALESCE($2, name),
                access = COALESCE($3, access),
                description = COALESCE($4, description)
            WHERE team_id = $1
            RETURNING id;`,
        [team_id, name, access, description]
        );
        return res.end();
    }
    res.status(403).send("Insufficient permissions");
});

//deletes the team row
router.delete("/team/:team_id", async(req, res) => {
    [curr_user_id, team_id] = //curr_user_id is temporary until we get auth0 identities
    [req.body["user_id"], req.params["team_id"]]
    
    const role = await get_team_role(curr_user_id, team_id);
    const granted = role != undefined && // user must be a member of the team
                    (roles.can(role)["deleteOwn"]("team").granted || // admin of this team
                    roles.can(role)["deleteAny"]("team").granted); // superuser exception
    
    if (granted) {
        const {rows} = await db.query(
            `DELETE public.team
            WHERE team_id = $1
            RETURNING id;`,
            [team_id]
        );
        return res.end();
    }
    res.status(403).send("Insufficient permissions"); 
});

// CREATE membership
// only called when:
//  user is requesting access to a team
//  admin is inviting a user (as a user or admin)
//  user clicks invite link (NOT YET SUPPORTED)
//      link would send user through a route with admin access to membership? or create membership w/ admin-approved flag on
router.post("/membership", async (req, res) => {
    [curr_user_id, user_id, team_id, access, user_approved, admin_approved] = // curr_user is temporary - identity will be verified by auth0
    [req.body["curr_user_id"], req.body["user_id"], req.body["team_id"], req.body["access"], req.body["user_approved"], req.body["admin_approved"]];
    console.log("curr_user_id:", curr_user_id);
    const role = await get_team_role(curr_user_id, team_id);

    console.log("role: ", role);
    const granted = (curr_user_id == user_id && role == undefined) || // user is requesting to join team
                    (curr_user_id != user_id && role == 'team_admin') && roles.can(role)["createOwn"]("membership").granted || 
                    roles.can(role)["createAny"]("membership").granted; // superuser exception
    console.log("granted: ", granted);

    if (role == undefined) { // user is requesting to join team
        access = 1; // access is always 'user'
        user_approved = 1;
        admin_approved = 0;
    }

    if (granted) {
        const result = await db.query(`INSERT INTO public.user_team_join(user_id, team_id, access, user_approved, admin_approved)
        VALUES ($1, $2, $3, $4, $5);`,
        [user_id, team_id, access, user_approved, admin_approved]
        ); 
        const location = req.path + '/' + user_id + '/' + team_id;
        if ('rows' in result) { // if membership isn't already in db
            res.status(201).location(location).json(result.rows).end();
        }
        else { // membership row exists - don't do anything
            res.status(403).send({"Error" : "Possibly: duplicate membership entry"});
        }
    } else {
        res.status(403).send({"Error": "Insufficient permissions"})
    }
});

router.get("/membership/:user_id/:team_id", async (req, res) => {
    [curr_user_id, user_id, team_id] = // curr_user is temporary - identity will be verified by auth0
    [req.body["curr_user_id"], req.params["user_id"], req.params["team_id"]]
    
    const role = await get_team_role(curr_user_id, team_id);
    console.log(role);
    const granted = curr_user_id == user_id || // user can see their own memberships regardless of status
                    role != undefined &&
                    ((curr_user_id == user_id || role == "team_admin") && roles.can(role)["readOwn"]("membership").granted ||
                    roles.can(role)["readAny"]("membership").granted);

    if (granted) {
        const result = await db.query(`SELECT * FROM public.user_team_join
        WHERE user_id = $1 AND team_id = $2;`,
        [user_id, team_id]
        );
        if ('rows' in result) {
            res.json(result.rows).end();
        }
        else {
            res.status(404).end();
        }
    }
    res.status(403).end();
});


// can only get if it's your own user_id or you're a superuser (superuser not implemented)
router.get("/membership/:user_id", async (req, res) => {
    [curr_user_id, user_id] = [req.body["curr_user_id"], req.params["user_id"]];
    
    if (curr_user_id == user_id) {
        const { rows } = await db.query(
            `SELECT team_id, access, user_approved, admin_approved FROM public.user_team_join
            WHERE user_id=$1;`,
            [user_id]
        );
        return res.json(rows).end();
    }
    res.status(403).send("Insufficient permissions");
    
});

// anyone can see members in their own team?
router.get("/membership/:team_id", async (req, res) => {
    [curr_user_id, team_id] = [req.body["curr_user_id"], req.params["team_id"]]

    const role = await get_team_role(curr_user_id, team_id);
    
    const granted = role != undefined || // user must be in the team
                    roles.can(role)["readAny"]("membership").granted; // otherwise, superuser can also read any
    console.log(role)
    if (granted) {
        const { rows } = await db.query(
            `SELECT user_id, access, user_approved, admin_approved FROM public.user_team_join
            WHERE team_id=$1;`,
            [team_id]
        );
        return res.json(rows);
    }
    res.status(403).send("Insufficient permissions");
});

// update membership
// can deactivate membership w/ status = 0, but just delete the row with /delete_membership
router.put("/membership/:user_id/:team_id", async (req, res) => { // REST would use PUT instead of POST to update
    [curr_user_id, user_id, team_id, access, user_approved, admin_approved] = 
    [req.body["curr_user_id"], req.params["user_id"], req.params["team_id"], req.body["access"], req.body["user_approved"], req.body["admin_approved"]]
    const role = await get_team_role(curr_user_id, team_id);
    console.log(role);

    const granted = role != undefined && // user must be a member of the team
                    ((curr_user_id == user_id || role == 'team_admin') && roles.can(role)["updateOwn"]("membership").granted || 
                    roles.can(role)["updateAny"]("membership").granted); // superuser exception
    console.log(granted);

    if (role == "user") {
        access = undefined; // access can't be changed
        admin_approved = undefined; // can't change admin_approved flag
    }

    if (granted) {
        const rows  = await db.query(`UPDATE public.user_team_join
        SET access = COALESCE($3, access),
            user_approved = COALESCE($4, user_approved),
            admin_approved = COALESCE($5, admin_approved)
        WHERE user_id = $1 AND team_id = $2
        RETURNING *;`,
        [user_id, team_id, access, user_approved, admin_approved]
        );
        // console.log(rows);
        return res.json(rows[0]);
    }
    res.status(403).send("Insufficient permissions");
});

// delete membership row
router.delete("/membership/:user_id/:team_id", async (req, res) => {
    [curr_user_id, user_id, team_id] = 
    [req.body["curr_user_id"], req.params["user_id"], req.params["team_id"]]
    const role = await get_team_role(curr_user_id, team_id);
    const granted = role != undefined && // user must be a member of the team
                    ((curr_user_id == user_id || role == 'team_admin') && roles.can(role)["deleteOwn"]("membership").granted ||
                    roles.can(role)["deleteAny"]("membership").granted); // superuser exception
    if (granted) {
        db.query(`DELETE FROM public.user_team_join
        WHERE user_id = $1 AND team_id = $2
        RETURNING *;`,
        [user_id, team_id]
        );
        res.end();
    }  
    res.status(403).send("Insufficient permissions");
});