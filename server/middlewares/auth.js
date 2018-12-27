const { User } = require('../models/user');
let auth = (req, res, next) => {
    let token = req.header('x-auth');

    User.findOneByToken(token).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        res.user = user;
        res.token = token;
        next();
    }).catch((e) => {
        res.status(401).send({ message: 'unauthorised' });
    });
};

module.exports = { auth };