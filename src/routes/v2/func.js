const Router = require("express-promise-router");
const db = require("../../db");
// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router();
// export our router to be mounted by the parent application
module.exports = router;

const { roles, get_team_role } = require('../../roles')

router.post("/upsert_task", async (req, res) => {
    let [curr_user_id, id, name, description, status, team, tenant, period, supervisor, position, created_by]
    = [req.body["curr_user_id"], req.body["id"], req.body["name"], req.body["description"], req.body["status"], req.body["team"], req.body["tenant"],
    req.body["period"], req.body["supervisor"], req.body["position"], req.body["created_by"]]
    
    // const role = await get_team_role(curr_user_id, team);
    // const granted = role != undefined && 
    //                 (curr_user_id == created_by && roles.can(role)["createOwn"]("task").granted ||
    //                 roles.can(role)["createAny"]("task").granted);

    if (true) {
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
        return res.json(rows[0]);
    }
    res.status(403).send("Insufficient permissions");
});

router.post("/assign_task", async (req, res) => {
    let [curr_user_id, user_id, task_id, team] = [req.body["curr_user_id"],req.body["user_id"], req.body["task_id"], req.body["team"]]
    
    const role = await get_team_role(curr_user_id, team);
    const granted = role != undefined && 
                    (curr_user_id == user_id && roles.can(role)["updateOwn"]("task").granted ||
                    roles.can(role)["updateAny"]("task").granted);

    if (granted) {
        await db.query(
        `UPDATE task 
        SET assigned_to = array_append(assigned_to, $1)  
        WHERE task.id = $2;`,
        [user_id, task_id]
        );
        await db.query(
        `UPDATE user_state 
        SET task = array_append(task, $2)   
        WHERE user_state.user_id = $1;`,
        [user_id, task_id]
        );
        return res.end();
    }
    res.status(403).send("Insufficient permissions");
});

router.post("/unassign_task", async (req, res) => {
    let [curr_user_id, user_id, task_id, team] = [req.body["curr_user_id"],req.body["user_id"], req.body["task_id"], req.body["team"]]
    const role = await get_team_role(curr_user_id, team);
    const granted = role != undefined && 
                    (curr_user_id == user_id && roles.can(role)["updateOwn"]("task").granted ||
                    roles.can(role)["updateAny"]("task").granted);

    if (granted) {
        await db.query(
        `UPDATE task 
        SET assigned_to = array_remove(assigned_to, $1)  
        WHERE task.id = $2;`,
        [user_id, task_id]
        );
        await db.query(
        `UPDATE user_state 
        SET task = array_remove(task, $2)
        WHERE user_state.user_id = $1;`,
        [user_id, task_id]
        );
        return res.end();
    }
    res.status(403).send("Insufficient permissions");
});

// get task by user - gets all tasks from teams that user is a part of
// TODO - allow a superuser to get all tasks (is this necessary?)
router.get("/task", async (req, res) => {
    if ( !(req.get("Current-User")) ) {
        return res.status(403).send("Authentication needed");
    }
  
    let user_id = req.get('Current-User');

    console.log("filtering by curr_user");
    let filter = `INNER JOIN 
                    (SELECT team_id FROM public.user_team_join
                    WHERE 
                        user_id = $1 AND
                        user_approved = B'1' AND
                        admin_approved = B'1') AS teams
                ON task.team = teams.team_id
                `;

    const {rows} = await db.query(
        `SELECT *, ST_asText(position) as position FROM public.task ` + filter + "ORDER BY id ASC;", 
        [user_id]
        );
    
    res.json(rows);
});

//modify an existing task
router.put("/task/:task_id", async(req, res) => {

    let [curr_user_id, task_id, name, description, status, team_id, period, supervisor, position]
    = [req.body["curr_user_id"], req.params["task_id"], req.body["name"], req.body["description"], req.body["status"], req.body["team_id"],
    req.body["period"], req.body["supervisor"], req.body["position"]]
    // const role = await get_team_role(curr_user_id, team_id);
    // console.log(role)
    // const granted = role != undefined && // user must be a member of the team
                    // (roles.can(role)["updateOwn"]("task").granted || // admin of this team
                    // roles.can(role)["updateAny"]("task").granted); // superuser exception
    
    if (true) {
        console.log("granted")
        const {rows} = await db.query(
            `UPDATE public.task
            SET name = COALESCE($2, name),
                description = COALESCE($3, description),
                status = COALESCE($4, status),
                period = COALESCE($5, period),
                supervisor = COALESCE($6, supervisor),
                position = COALESCE($7, position)
            WHERE task.id = $1;`,
        [task_id, name, description, status, period, supervisor, position]
        );
        return res.end();
    }
    res.status(403).send("Insufficient permissions");
});


//delete a task
router.delete("/task/:task_id", async (req, res) => {
    let [task_id] = [req.params["task_id"]];
    let [curr_user_id, user_id, team] = [req.body["curr_user_id"], req.body["user_id"], req.body["team"]]
    const role = await get_team_role(curr_user_id, team);
    const granted = role != undefined && 
                    (curr_user_id == user_id && roles.can(role)["deleteOwn"]("task").granted ||
                    roles.can(role)["deleteAny"]("task").granted);

    if (granted) {
        await db.query(
        `DELETE task 
        WHERE task.id = $1;`,
        [task_id]
        );
        return res.end();
    }
    res.status(403).send("Insufficient permissions");
});


//team management APIs

//create a new team by user - return status 201 and location of resource!
// no permissioning check required for creating a team entry
router.post("/team", async (req, res) => {
    let [user_id, name, access, description] = 
    [req.body["user_id"], req.body["name"], req.body["access"], req.body["description"]]
    const {rows} = await db.query(
        `INSERT INTO public.team(name, access, description, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id;`,
    [name, access, description, user_id]
    );

    team_id = rows[0]["id"]
    await db.query(
    `INSERT INTO public.user_team_join(
    user_id, team_id, access, user_approved, admin_approved)
    VALUES ($1, $2, 1, B'1', B'1');`,
    [user_id, team_id]
    );

    const location = req.path + '/' + team_id;
    res.set('Access-Control-Expose-Headers', 'Location').location(location).status(201).end();
});

// get all teams
router.get("/team", async (req, res) => {
    // any user can read team info
    const { rows } = await db.query(
    `select * from public.team
        inner join  (
            select team_id as id, count(user_id) as member_count
                from user_team_join 
                where admin_approved = 'B1' and user_approved = 'B1' 
                group by team_id
                ) as member_counts
            using (id)
    order by id asc;
    `
    );
    res.json(rows)
});

// get team by id
router.get("/team/:team_id", async (req, res) => {
    let [team_id] = [req.params["team_id"]];
    const { rows } = await db.query(
        `select * from public.team
        inner join  (
            select team_id as id, count(user_id) as member_count
                from user_team_join 
                where admin_approved = 'B1' and user_approved = 'B1' 
                group by team_id
                ) as member_counts
            using (id)
        where id = $1;`,
        [team_id]
    );
    res.json(rows)
});

//modify an existing team
router.put("/team/:team_id", async(req, res) => {
    let [curr_user_id, team_id, name, access, description] = //user_id is temporary until we get auth0 identities
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
            WHERE id = $1
            RETURNING id;`,
        [team_id, name, access, description]
        );
        return res.end();
    }
    res.status(403).send("Insufficient permissions");
});

//deletes the team row
router.delete("/team/:team_id", async(req, res) => {
    let [curr_user_id, team_id] = //curr_user_id is temporary until we get auth0 identities
    [req.body["user_id"], req.params["team_id"]]
    
    const role = await get_team_role(curr_user_id, team_id);
    const granted = role != undefined && // user must be a member of the team
                    (roles.can(role)["deleteOwn"]("team").granted || // admin of this team
                    roles.can(role)["deleteAny"]("team").granted); // superuser exception
    
    if (granted) {
        const deleted_rows = await db.query(
            `WITH deleted AS 
                (DELETE FROM public.user_team_join 
                WHERE team_id = $1 
                RETURNING *) 
            SELECT count(*) FROM deleted;`,
            [team_id]
        );
        console.log("Deleted ", deleted_rows, " rows");
        await db.query(
            `DELETE FROM public.team
            WHERE id = $1
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
    let [curr_user_id, user_id, team_id, access, user_approved, admin_approved] = // curr_user is temporary - identity will be verified by auth0
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
        VALUES ($1, $2, $3, cast($4 as bit(1)), cast($5 as bit(1)));`,
        [user_id, team_id, access, user_approved, admin_approved]
        ); 
        const location = req.path + '/' + user_id + '/' + team_id;
        if ('rows' in result) { // if membership isn't already in db
            res.status(201).set('Access-Control-Expose-Headers', 'Location').location(location).json(result.rows).end();
        }
        else { // membership row exists - don't do anything
            res.status(403).send({"Error" : "Likely a duplicate membership entry"});
        }
    } else {
        res.status(403).send({"Error": "Insufficient permissions"})
    }
});

router.get("/membership/:user_id/:team_id", async (req, res) => {

    let [curr_user_id, user_id, team_id] = // curr_user is temporary - identity will be verified by auth0
    [req.get('Current-User'), req.params["user_id"], req.params["team_id"]]
    const role = await get_team_role(curr_user_id, team_id);
        
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
    else {
        res.status(403).end();
    }
});


// get membership 
router.get("/membership", async (req, res) => {
    [curr_user_id, user_id, team_id] = [req.get('Current-User'), req.query["user_id"], req.query["team_id"]];
    
    // const role = await get_team_role(curr_user_id, team_id);

    if (user_id && (! team_id)) {
        // filtering by user
        // can only get if it's your own user_id or you're a superuser (superuser not implemented)

        // if (curr_user_id == user_id || 
        //     (role != undefined && roles.can(role)["readAny"]("membership").granted)) // superuser can read any
        //     {
        const { rows } = await db.query(
            `SELECT team_id, access, user_approved, admin_approved FROM public.user_team_join
            WHERE user_id=$1;`,
            [user_id]
        );
        res.json(rows).end();
        // }
        // else {
        //     res.status(403).send("Insufficient permissions");
        // }
    }
    else if ((! user_id) && team_id) {
        // filtering by team
        // anyone can see members in their own team?
        
        // const granted = role != undefined || // user must be in the team
        //                 roles.can(role)["readAny"]("membership").granted; // otherwise, superuser can also read any
        // console.log(role)
        // if (granted) {
            const { rows } = await db.query(
                `SELECT user_id, access, user_approved, admin_approved FROM public.user_team_join
                WHERE team_id=$1;`,
                [team_id]
            );
            res.json(rows);
        // }
        // else {
        //     res.status(403).send("Insufficient permissions");
        // }
    } else if (user_id && team_id) {
        res.redirect('membership/' + user_id + '/' + team_id);
    }
    else {
        // if (role && roles.can(role)["readAny"]("membership").granted){
            const { rows } = await db.query(
                `SELECT user_id, access, user_approved, admin_approved FROM public.user_team_join;`
            );
            res.json(rows);
        // } else {
        //     res.status(403).send("Insufficient permissions");
        // }
    }
});

// update membership
// can deactivate membership w/ status = 0, but just delete the row with /delete_membership
router.put("/membership/:user_id/:team_id", async (req, res) => { // REST would use PUT instead of POST to update
    let [curr_user_id, user_id, team_id, access, user_approved, admin_approved] = 
    [req.body["curr_user_id"], req.params["user_id"], req.params["team_id"], req.body["access"], req.body["user_approved"], req.body["admin_approved"]]
    const role = await get_team_role(curr_user_id, team_id);
    console.log("role: ", role);

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
            user_approved = COALESCE($4, public.user_team_join.user_approved)::bit(1),
            admin_approved = COALESCE($5, public.user_team_join.admin_approved)::bit(1)
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
    let [curr_user_id, user_id, team_id] = 
    [req.body["curr_user_id"], req.params["user_id"], req.params["team_id"]]
    const role = await get_team_role(curr_user_id, team_id);
    const granted = role != undefined && // user must be a member of the team
                    ((curr_user_id == user_id || role == 'team_admin') && roles.can(role)["deleteOwn"]("membership").granted ||
                    roles.can(role)["deleteAny"]("membership").granted); // superuser exception
    if (granted) {
        await db.query(`DELETE FROM public.user_team_join
        WHERE user_id = $1 AND team_id = $2
        RETURNING *;`,
        [user_id, team_id]
        );
        res.end();
    }  
    res.status(403).send("Insufficient permissions");
});