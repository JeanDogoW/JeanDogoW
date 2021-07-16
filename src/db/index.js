const { Pool } = require("pg");

const pool = new Pool({
  host: "perimeter-slc-db.cpmx2lij8inl.us-west-2.rds.amazonaws.com",
  user: "perimeterowner",
  database: "postgres",
  password: "Uber5blockchain",
  port: 5432
});

const poolV2 = new Pool({
  host: "perimeterdb.cpmx2lij8inl.us-west-2.rds.amazonaws.com",
  user: "perimeter_admin",
  database: "postgres",
  password: "Prmtr3232!",
  port: 5432
});

module.exports = {
  query: (text, params, version) => {
    // console.log(text, params);
    console.log(Date.now())
    const queryPool = version && version == 2 ? poolV2 : pool
    return queryPool.query(text, params)
    .then((result) => {
      // console.log(result.rows);
      return result;
    }).catch(err => {
      console.log(err);
      const message = parseErr(err);
      return message;
    });
  },
};

function parseErr(err){
  if (err) {
    let msg;
    if (err.code == '23505') {
      msg = "Duplicate key value in table"
    }
    else {
      msg = err.details && "";
    }
    console.log('Error: ', msg);
    return {'error_message' : msg}
  }
}