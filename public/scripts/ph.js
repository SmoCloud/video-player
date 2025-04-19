//JUST A PLACE HOLDER, THIS FILE WILL BE REMOVED IN THE FUTURE

unction getPermLevel() {
 dbServer.query(`SELECT * FROM accounts where user_id LIKE ${request.session.user.userid}`, function (err, result, fields) {
    if (err) throw err;
    return result[0].perm;
 });
};