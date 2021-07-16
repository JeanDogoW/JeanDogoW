const Router = require("express-promise-router");
const db = require("../db");
// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router();
// export our router to be mounted by the parent application
module.exports = router;
// router.get("/:id", async (req, res) => {
//   const { id } = req.params;
//   const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
//   res.send(rows[0]);
// });

router.post("/upsert_user", async (req, res) => {
  let [id, email] = [req.body["id"], req.body["email"]];
  db.query(
    `INSERT into public.user(id, email) 
    VALUES ($1, $2)
    ON CONFLICT (id)
    DO UPDATE SET email = $2;
    `,
    [id, email]
  );
  db.query(
    `INSERT into public.user_state(user_id) 
    VALUES ($1)
    ON CONFLICT (user_id)
    DO NOTHING;
    `,
    [id]
  );

  // console.log(user_id)
  res.end();
});

router.post("/update_user", async (req, res) => {
  let [
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

  db.query(
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
  res.end();
});

router.post("/upsert_user_state", async (req, res) => {
  let [
    user_id,
    status,
    shift,
    sharing_location,
    call_sign,
    active_task,
    task,
  ] = [
    req.body["user_id"],
    req.body["status"],
    req.body["shift"],
    req.body["sharing_location"],
    req.body["call_sign"],
    req.body["active_task"],
    req.body["task"],
  ];
  db.query(
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
  res.end();
});

router.post("/upsert_user_location", async (req, res) => {
  let[position, user_id, status, time] = [req.body["position"], req.body["user_id"], req.body["status"], req.body["time"]];
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
  res.end();
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
  const { rows } = await db.query(
    `SELECT user_id, ST_AsText(position), status, last_edited_time FROM user_location;`
  );
  res.json(rows);
});