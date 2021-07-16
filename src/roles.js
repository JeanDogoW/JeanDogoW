const { Query } = require("pg");
const db = require("./db");
const AccessControl = require('accesscontrol');

// grant list fetched from DB (to be converted to a valid grants object, internally)
let grantList = [
    // Membership AC

    { role: 'global_admin', resource: 'membership', action: 'create:any', attributes: '*' },
    // { role: 'global_admin', resource: 'membership', action: 'read:any', attributes: '*' }, // bugfix/unjoinedteamcard-memberlist -- making memberships readAny
    { role: 'global_admin', resource: 'membership', action: 'update:any', attributes: '*' },
    { role: 'global_admin', resource: 'membership', action: 'delete:any', attributes: '*' },

    { role: 'team_admin', resource: 'membership', action: 'create:own', attributes: '*' },
    // { role: 'team_admin', resource: 'membership', action: 'read:own', attributes: '*' },
    { role: 'team_admin', resource: 'membership', action: 'update:own', attributes: '*' },
    { role: 'team_admin', resource: 'membership', action: 'delete:own', attributes: '*' },

    // { role: 'user', resource: 'membership', action: 'create:own', attributes: '*, !access' }, // if user is already in team they can't create a new membership
    // { role: 'user', resource: 'membership', action: 'read:own', attributes: '*' },
    { role: 'user', resource: 'membership', action: 'update:own', attributes: '*, !admin' },
    { role: 'user', resource: 'membership', action: 'delete:own', attributes: '*' },


    // Team AC

    // { role: 'global_admin', resource: 'team', action: 'read:any', attributes: '*' }, // anyone can read team data
    { role: 'global_admin', resource: 'team', action: 'update:any', attributes: '*' },
    { role: 'global_admin', resource: 'team', action: 'delete:any', attributes: '*' },

    // { role: 'team_admin', resource: 'team', action: 'read:own', attributes: '*' },
    { role: 'team_admin', resource: 'team', action: 'update:own', attributes: '*' },
    { role: 'team_admin', resource: 'team', action: 'delete:own', attributes: '*' },


    // User AC

    { role: 'global_admin', resource: 'user', action: 'create:any', attributes: '*' },
    { role: 'global_admin', resource: 'user', action: 'update:any', attributes: '*' },
    { role: 'global_admin', resource: 'user', action: 'delete:any', attributes: '*' },
    
    { role: 'user', resource: 'user', action: 'create:own' },
    { role: 'user', resource: 'user', action: 'update:own' },
    { role: 'user', resource: 'user', action: 'delete:own' },


    // Data AC

    { role: 'global_admin', resource: 'data', action: 'create:any', attributes: '*' },
    { role: 'global_admin', resource: 'data', action: 'read:any', attributes: '*' },
    { role: 'global_admin', resource: 'data', action: 'update:any', attributes: '*' },
    { role: 'global_admin', resource: 'data', action: 'delete:any', attributes: '*' },

    { role: 'team_admin', resource: 'data', action: 'create:any', attributes: '*' },
    { role: 'team_admin', resource: 'data', action: 'read:any', attributes: '*' },
    { role: 'team_admin', resource: 'data', action: 'update:any', attributes: '*' },
    { role: 'team_admin', resource: 'data', action: 'delete:any', attributes: '*' },

    { role: 'user', resource: 'data', action: 'create:own', attributes: '*' }, 
    { role: 'user', resource: 'data', action: 'read:any', attributes: '*' },
    { role: 'user', resource: 'data', action: 'update:any', attributes: '*' },
    { role: 'user', resource: 'data', action: 'delete:own', attributes: '*' },

    // Task AC

    // ownership defined as the user who created the task
    // any defined as any task within the team
    { role: 'global_admin', resource: 'task', action: 'create:any', attributes: '*' },
    { role: 'global_admin', resource: 'task', action: 'read:any', attributes: '*' },
    { role: 'global_admin', resource: 'task', action: 'update:any', attributes: '*' },
    { role: 'global_admin', resource: 'task', action: 'delete:any', attributes: '*' },

    { role: 'team_admin', resource: 'task', action: 'create:own', attributes: '*' }, // tasks can't be created on behalf of others
    { role: 'team_admin', resource: 'task', action: 'read:any', attributes: '*' },
    { role: 'team_admin', resource: 'task', action: 'update:any', attributes: '*' },
    { role: 'team_admin', resource: 'task', action: 'delete:any', attributes: '*' },

    { role: 'user', resource: 'task', action: 'create:own', attributes: '*' }, 
    { role: 'user', resource: 'task', action: 'read:any', attributes: '*' },
    { role: 'user', resource: 'task', action: 'update:any', attributes: '*' },
    { role: 'user', resource: 'task', action: 'delete:own', attributes: '*' },
];

const ac = new AccessControl(grantList);

exports.roles = ac;
exports.get_team_role = (async (user_id, team_id) => {
    // add logic for superuser exception
    if (user_id == "admin@a.com"){
        return "global_admin";
    }
    
    if (!team_id){
        team_id = -1;
    }
    const { rows } = await db.query(
        `SELECT user_id, access, user_approved, admin_approved FROM public.user_team_join
        WHERE user_id=$1 AND team_id=$2;`,
        [user_id, team_id]
        );
    if (rows.length != 1) { // no membership row found
        console.log("no membership found"); // TODO: might be useful to just have a distinction between unjoined_user and team_user -- that way we don't have undefined checks everywhere in the api AC logic
        return;
    }
    const status = rows[0]["user_approved"] << 1 | rows[0]["admin_approved"];
    const access_role = {0: 'global_admin', 1: 'team_admin', 2: 'user'}
    if (status == 0b11){ // return a role only if the user is in the team
        return access_role[rows[0]["access"]];
    }
    return;
});
exports.get_user_role = (async (user_id) => {
    // add logic for superuser exception
    if (user_id == "admin@a.com"){
        return "global_admin";
    }
    // add check for valid user id?
    return 'user';
});