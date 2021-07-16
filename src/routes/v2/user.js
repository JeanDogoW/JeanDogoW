const Router = require("express-promise-router");
const db = require("../../db");
// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router();
// export our router to be mounted by the parent application
module.exports = router;


const { roles, get_user_role } = require('../../roles')

router.post("/upsert_user", async (req, res) => {
  let [curr_user_id, id, email] = [req.body["curr_user_id"], req.body["id"], req.body["email"]];
  const role = await get_user_role(curr_user_id);
  const granted = curr_user_id == id && roles.can(role)["updateOwn"]("user").granted || // user modifying own profile
                  roles.can(role)["updateAny"]("user").granted; // superuser exception

  if (granted) {
    await db.query(
    `INSERT into public.user(id, email) 
    VALUES ($1, $2)
    ON CONFLICT (id)
    DO UPDATE SET email = $2;
    `,
    [id, email]
    );
    await db.query(
      `INSERT into public.user_state(user_id) 
      VALUES ($1)
      ON CONFLICT (user_id)
      DO NOTHING;
      `,
      [id]
    );
    // join demo team - hardcoded id of 179. Either need to hardcode id (faster) or prevent users from creating
    // teams named "Demo" and manually select the id each time a user is created.
    // users join as regular members - not admins.
    await db.query(`INSERT INTO public.user_team_join(user_id, team_id, access, user_approved, admin_approved)
        VALUES ($1, $2, $3, cast($4 as bit(1)), cast($5 as bit(1)))
        ON CONFLICT ON CONSTRAINT team_pkey
        DO NOTHING;`, // unique team/user combo
        [id, 179, 2, 1, 1]
    );

    return res.json(id);
  }
  res.status(403).send("Insufficient permissions");
});

router.post("/update_user", async (req, res) => {
  let [
    curr_user_id,
    id,
    name,
    access,
    agency,
    title,
    email,
    phone,
    status,
    age,
    skills,
    additional_info,
  ] = [
    req.body["curr_user_id"],
    req.body["id"],
    req.body["name"],
    req.body["access"],
    req.body["agency"],
    req.body["title"],
    req.body["email"],
    req.body["phone"],
    req.body["status"],
    req.body["age"],
    req.body["skills"],
    req.body["additional_info"],
  ];
  
  const role = await get_user_role(curr_user_id);
  const granted = curr_user_id == id && roles.can(role)["updateOwn"]("user").granted || // user modifying own profile
                  roles.can(role)["updateAny"]("user").granted; // superuser exception

  if (granted) {
    await db.query(
      `INSERT into public.user(id, name, access, agency, title, email, phone, status, age, skills, additional_info) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id)
      DO UPDATE SET 
        name = COALESCE($2, public.user.name), 
        access = COALESCE($3, public.user.access), 
        agency = COALESCE($4, public.user.agency), 
        title = COALESCE($5, public.user.title), 
        email = COALESCE($6, public.user.email), 
        phone = COALESCE($7, public.user.phone), 
        status = COALESCE($8, public.user.status), 
        age = COALESCE($9, public.user.age), 
        skills = COALESCE($10, public.user.skills), 
        additional_info = COALESCE($11, public.user.additional_info);
    `,
      [
        id,
        name,
        access,
        agency,
        title,
        email,
        phone,
        status,
        age,
        skills,
        additional_info,
      ]
    );
    return res.json(id);
  }
  res.status(403).send("Insufficient permissions");
  
});

router.post("/upsert_user_state", async (req, res) => {
  let [
    curr_user_id,
    user_id,
    status,
    shift,
    sharing_location,
    call_sign,
    active_task,
    task,
  ] = [
    req.body["curr_user_id"],
    req.body["user_id"],
    req.body["status"],
    req.body["shift"],
    req.body["sharing_location"],
    req.body["call_sign"],
    req.body["active_task"],
    req.body["task"],
  ];
  
  const role = await get_user_role(curr_user_id);
  const granted = curr_user_id == user_id && roles.can(role)["updateOwn"]("user").granted || // user modifying own profile
                  roles.can(role)["updateAny"]("user").granted; // superuser exception

  if (granted) {
    await db.query(
      `INSERT into public.user_state(user_id, status, shift, sharing_location, call_sign, active_task, task) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id)
      DO UPDATE SET 
  
        status = COALESCE($2, public.user_state.status), 
        shift = COALESCE($3, public.user_state.shift), 
        sharing_location = COALESCE($4, public.user_state.sharing_location), 
        call_sign = COALESCE($5, public.user_state.call_sign), 
        active_task = COALESCE($6, public.user_state.active_task), 
        task = COALESCE($7, public.user_state.task)`,
      [user_id, status, shift, sharing_location, call_sign, active_task, task]
    );
    return res.json(user_id);
  }
  res.status(403).send("Insufficient permissions");
});

router.post("/upsert_user_location", async (req, res) => {
  let[curr_user_id, position, user_id, status, time] = [req.body["curr_user_id"], req.body["position"], req.body["user_id"], req.body["status"], req.body["time"]];
  const role = await get_user_role(curr_user_id);
  const granted = curr_user_id == user_id && roles.can(role)["updateOwn"]("user").granted || // user modifying own profile
                  roles.can(role)["updateAny"]("user").granted; // superuser exception
  console.log("upsert user location")
  if (granted) {
    console.log("granted")
    await db.query(
      `INSERT into user_location(user_id, position, last_edited_time, status)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      position = COALESCE($2, user_location.position), 
      last_edited_time = COALESCE($3, user_location.last_edited_time), 
      status = COALESCE($4, user_location.status)`,
      [user_id, position, time, status]
    );
    console.log(user_id, position, time)
    return res.json(user_id);
  }
  console.log(user_id, position, time)
  res.status(403).send("Insufficient permissions");
});

router.get("/get_user", async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM public.user;`);
  res.json(rows);
});

router.get("/get_user_state", async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM public.user_state;`);
  res.json(rows);
});

router.get("/get_user_location", async (req, res) => {
  // console.log("get user location")
  const { rows } = await db.query(
    `SELECT user_id, ST_AsText(position), status, last_edited_time FROM user_location;`
  );
  res.json(rows);
});
