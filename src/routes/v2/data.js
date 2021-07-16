const Router = require("express-promise-router");
const db = require("../../db");
const checkJwt = require("../../authentication/checkJwt")

// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router();

// export our router to be mounted by the parent application
module.exports = router;

const { roles, get_team_role } = require('../../roles')

router.post("/add_polygon_evac", async (req, res) => {
  const json = req.body;
  //check for required field
  if (json["name"].length == 0){
    console.log("name cannot be empty");
    return res.end();
  }
  
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["createOwn"]("data").granted ||
                  roles.can(role)["createAny"]("data").granted);

  if (granted) {
    const { rows } = await db.query(
      `
    INSERT INTO polygon_evac 
      (name, position, access, status, county, created_by, last_edited_by, created_time, last_edited_time, published, team)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id;
      `,
      [
        json["name"],
        json["position"],
        json["access"],
        json["status"],
        json["county"],
        json["user"],
        json["user"],
        json["time"],
        json["time"],
        json["published"],
        json["team_id"]
      ]
    );
    return res.json(rows[0]);
  }
  res.status(403).send("Insufficient permissions");
});

router.post("/add_info_polygon_evac", async (req, res) => {
  const json = req.body;
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["createOwn"]("data").granted ||
                  roles.can(role)["createAny"]("data").granted);

  if (granted) {
    await db.query(
      `INSERT INTO info_polygon_evac 
        (description, action, additional_info, access, county, created_by, last_edited_by, created_time, last_edited_time, target)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        json["description"],
        json["action"],
        json["additional_info"],
        json["access"],
        json["county"],
        json["user"],
        json["user"],
        json["time"],
        json["time"],
        json["target"]
      ]
    );
    return res.json();
  }
  else{
    res.status(403).send("Insufficient permissions");
  }
});

router.get("/get_polygon_evac", async (req, res) => {
  if ( !(req.get("Current-User")) ) {
    return res.status(403).send("Authentication needed");
  }

  let user_id = req.get('Current-User');
  const { rows } = await db.query(`
    SELECT
    DISTINCT ON (info_polygon_evac.target)
    polygon_evac.id as poly_id, polygon_evac.access as poly_access,
    polygon_evac.status as poly_status, polygon_evac.county as poly_county,
    polygon_evac.created_by as poly_created_by, polygon_evac.last_edited_by as poly_last_edited_by,
    polygon_evac.created_time as poly_created_time, polygon_evac.last_edited_time as poly_last_edited_time,
    ST_AsText(polygon_evac.position) as poly_position, polygon_evac.name as poly_name,
    polygon_evac.published as poly_published, polygon_evac.team as poly_team,
    info_polygon_evac.id as info_id, info_polygon_evac.description as info_description,
    info_polygon_evac.action as info_action, info_polygon_evac.additional_info as info_additional_info,
    info_polygon_evac.access as info_access, info_polygon_evac.county as info_county, 
    info_polygon_evac.created_by as info_created_by, info_polygon_evac.last_edited_by as info_last_edited_by,
    info_polygon_evac.created_time as info_created_time,
    info_polygon_evac.last_edited_time as info_last_edited_time
    FROM
    info_polygon_evac
    inner join polygon_evac
      on polygon_evac.id = info_polygon_evac.target
    inner join (SELECT team_id FROM public.user_team_join
                WHERE 
                    user_id = $1 AND
                    user_approved = B'1' AND
                    admin_approved = B'1') AS teams
      on polygon_evac.team = teams.team_id
    WHERE polygon_evac.status >= 0
    ORDER BY
    info_polygon_evac.target,
    info_polygon_evac.last_edited_time desc,
    info_polygon_evac.id;
    `, [user_id]);
  res.json(rows);

});

router.post("/edit_polygon_evac/:attr", async (req, res) => {
  const json = req.body;
  const attr = req.params.attr;
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["updateOwn"]("data").granted ||
                  roles.can(role)["updateAny"]("data").granted);

  if (granted) {
    await db.query(
      `
      UPDATE polygon_evac 
      SET ${attr} = $1, last_edited_by = $2, last_edited_time = $3
      WHERE id = $4;        
    `,
      [json["new_data"], json["user"], json["time"], json["id"]]
    );
    return res.end();
  }
  res.status(403).send("Insufficient permissions");
});

//line_evac api calls

router.post("/add_line_evac", async (req, res) => {
  const json = req.body;
  //check for required field
  if (json["name"].length == 0){
    console.log("name cannot be empty")
    return res.end()
  }
  
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["createOwn"]("data").granted ||
                  roles.can(role)["createAny"]("data").granted);
  if (granted) { 
    const { rows } = await db.query(
      `
      INSERT INTO line_evac 
        (name, position, access, status, county, created_by, last_edited_by, created_time, last_edited_time, published, team)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id;
          `,
      [
        json["name"],
        json["position"],
        json["access"],
        json["status"],
        json["county"],
        json["user"],
        json["user"],
        json["time"],
        json["time"],
        json["published"],
        json["team_id"]
      ]
    );
    return res.json(rows[0]);
  }
  res.status(403).send("Insufficient permissions");
});

router.post("/add_info_line_evac", async (req, res) => {
  const json = req.body;
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["createOwn"]("data").granted ||
                  roles.can(role)["createAny"]("data").granted);
  if (granted) {
    await db.query(
      `INSERT INTO info_line_evac 
          (description, action, additional_info, access, county, created_by, last_edited_by, created_time, last_edited_time, target)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        json["description"],
        json["action"],
        json["additional_info"],
        json["access"],
        json["county"],
        json["user"],
        json["user"],
        json["time"],
        json["time"],
        json["target"]
      ]
    );
    return res.end();
  }
  res.status(403).send("Insufficient permissions");
});

router.get("/get_line_evac", async (req, res) => {
  if ( !(req.get("Current-User")) ) {
    return res.status(403).send("Authentication needed");
  }

  let user_id = req.get('Current-User');
  const { rows } = await db.query(`
    SELECT
      DISTINCT ON (info_line_evac.target)
      line_evac.id as line_id, line_evac.access as line_access,
      line_evac.status as line_status, line_evac.county as line_county,
      line_evac.created_by as line_created_by, line_evac.last_edited_by as line_last_edited_by,
      line_evac.created_time as line_created_time, line_evac.last_edited_time as line_last_edited_time,
      ST_AsText(line_evac.position) as line_position, line_evac.name as line_name,
      line_evac.published as line_published, line_evac.team as line_team,
      info_line_evac.id as info_id, info_line_evac.description as info_description,
      info_line_evac.action as info_action, info_line_evac.additional_info as info_additional_info, info_line_evac.access as info_access,
      info_line_evac.county as info_county, info_line_evac.created_by as info_created_by,
      info_line_evac.last_edited_by as info_last_edited_by,
      info_line_evac.created_time as info_created_time,
      info_line_evac.last_edited_time as info_last_edited_time
    FROM
      info_line_evac
      inner join line_evac
      on line_evac.id = info_line_evac.target
      inner join (SELECT team_id FROM public.user_team_join
                  WHERE 
                      user_id = $1 AND
                      user_approved = B'1' AND
                      admin_approved = B'1') AS teams
      on line_evac.team = teams.team_id
    WHERE line_evac.status >= 0
    ORDER BY
      info_line_evac.target,
      info_line_evac.last_edited_time desc,
      info_line_evac.id;
        `, [user_id]);
  res.json(rows);
});

router.post("/edit_line_evac/:attr", async (req, res) => {
  const json = req.body;
  const attr = req.params.attr;
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["updateOwn"]("data").granted ||
                  roles.can(role)["updateAny"]("data").granted);

  if (granted) {
    await db.query(
      `
        UPDATE line_evac 
        SET ${attr} = $1, last_edited_by = $2, last_edited_time = $3
      WHERE id = $4;        
    `,
      [json["new_data"], json["user"], json["time"], json["id"]]
    );
    return res.end();
  }
  res.status(403).send("Insufficient permissions");
});

// point data apis

router.post("/add_point_data", async (req, res) => {
  const json = req.body;
  //check for required field
  if (json["name"].length == 0){
    console.log("name cannot be empty")
    res.end()
  }
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["createOwn"]("data").granted ||
                  roles.can(role)["createAny"]("data").granted);
  if (granted) {
    const { rows } = await db.query(
      `
        INSERT INTO point_data 
          (name, position, type, access, status, county, created_by, last_edited_by, created_time, last_edited_time, published, team)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id;
            `,
      [
        json["name"],
        json["position"],
        json["type"],
        json["access"],
        json["status"],
        json["county"],
        json["user"],
        json["user"],
        json["time"],
        json["time"],
        json["published"],
        json["team_id"]
      ]
    );
    return res.json(rows[0]);
  }
  res.status(403).send("Insufficient permissions");
});

router.post("/add_info_point_data", async (req, res) => {
  const json = req.body;
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["createOwn"]("data").granted ||
                  roles.can(role)["createAny"]("data").granted);
  if (granted) {
    await db.query(
      `INSERT INTO info_point_data 
            (description, action, additional_info, access, county, created_by, last_edited_by, created_time, last_edited_time, target)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        json["description"],
        json["action"],
        json["additional_info"],
        json["access"],
        json["county"],
        json["user"],
        json["user"],
        json["time"],
        json["time"],
        json["target"]
      ]
    );
    return res.end();
  }
  res.status(403).send("Insufficient permissions");
});

//there has to be sql sanitation

router.get("/get_point_data", async (req, res) => {
  if ( !(req.get("Current-User")) ) {
    return res.status(403).send("Authentication needed");
  }

  let user_id = req.get('Current-User');
  const { rows } = await db.query(`
      SELECT
        DISTINCT ON (info_point_data.target)
        point_data.id as point_id, point_data.access as point_access, point_data.type as point_type,
        point_data.status as point_status, point_data.county as point_county,
        point_data.created_by as point_created_by, point_data.last_edited_by as point_last_edited_by,
        point_data.created_time as point_created_time, point_data.last_edited_time as point_last_edited_time,
        ST_AsText(point_data.position) as point_position, point_data.name as point_name,
        point_data.published as point_published, point_data.team as point_team, point_data.severity as point_severity,
        info_point_data.id as info_id, info_point_data.description as info_description,
        info_point_data.action as info_action, info_point_data.additional_info as info_additional_info, info_point_data.access as info_access,
        info_point_data.county as info_county, info_point_data.created_by as info_created_by,
        info_point_data.last_edited_by as info_last_edited_by,
        info_point_data.created_time as info_created_time,
        info_point_data.last_edited_time as info_last_edited_time
      FROM
        info_point_data
        inner join point_data
        on point_data.id = info_point_data.target
        inner join (SELECT team_id FROM public.user_team_join
                    WHERE 
                        user_id = $1 AND
                        user_approved = B'1' AND
                        admin_approved = B'1') AS teams
          on point_data.team = teams.team_id
      WHERE point_data.status >= 0
      ORDER BY
        info_point_data.target,
        info_point_data.last_edited_time desc,
        info_point_data.id;
          `, [user_id]);
  res.json(rows);
});

router.post("/edit_point_data/:attr", async (req, res) => {
  const json = req.body;
  const attr = req.params.attr;
  const role = await get_team_role(json["curr_user_id"], json["team_id"]);
  const granted = role != undefined && 
                  (json["curr_user_id"] == json["user"] && roles.can(role)["updateOwn"]("data").granted ||
                  roles.can(role)["updateAny"]("data").granted);

  if (granted) {
    await db.query(
      `
        UPDATE point_data 
        SET ${attr} = $1, last_edited_by = $2, last_edited_time = $3
      WHERE id = $4;        
    `,
      [json["new_data"], json["user"], json["time"], json["id"]]
    );
    return res.end();
  }
  res.status(403).send("Insufficient permissions");
});

router.get("/get_unpublished_event", async (req, res) => {
  const { rows } = await db.query(`
    SELECT * FROM unpublished_line_event union all select * from unpublished_point_event union all select * from unpublished_polygon_event 
    order by event_last_edited_time DESC;
		`);
  res.json(rows);
});

router.get("/get_published_event", checkJwt.withAuth, async (req, res) => {
  const { rows } = await db.query(`
    SELECT * FROM published_line_event union all select * from published_point_event union all select * from published_polygon_event 
    order by event_last_edited_time DESC;
		`);
  res.json(rows);
});

//testing pushing geojson
router.get("/geojson", (req, res) => {
  // res.end();
  res.send({
    type: "Feature",
    properties: {
      name: "Bermuda Triangle",
      area: 1150180
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-122.73, 37.31],
          [-122.19, 37.76],
          [-122.09, 37.43]
        ]
      ]
    }
  });
});
