module.exports.isAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ msg: 'You are not authorized to view this resource' });
    }
}
module.exports.isAdminorSupervisor = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === "Admin" || req.user.role === "Supervisor")) {
        next();
    } else {
        res.status(401).send({ msg: 'You are not authorized to view this resource because you are not an admin.' });
    }
}

module.exports.isUser = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "User") {
        next();
    } else {
        res.status(401).send({ msg: 'You are not authorized to view this resource because you are not an admin.' });
    }
}

module.exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "Admin") {
        next();
    } else {
        res.status(401).send({ msg: 'You are not authorized to view this resource because you are not an admin.' });
    }
}

module.exports.isSupervisor = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "Supervisor") {
        next();
    } else {
        res.status(401).send({ msg: 'You are not authorized to view this resource because you are not an admin.' });
    }
}

