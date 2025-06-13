exports.sessionProtect = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    // Attach user info for controller
    req.user = { _id: req.session.userId };
    next();
};
// This middleware checks if the user is authenticated by checking the session.