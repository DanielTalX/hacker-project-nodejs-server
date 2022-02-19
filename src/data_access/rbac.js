/**
 * Role-based access control (RBAC) is a method of regulating access to computer
 * or network resources based on the roles of individual users.
 */
// https://www.npmjs.com/package/accesscontrol
const AccessControl = require("accesscontrol");
const ac = new AccessControl();

// Defining the roles in the system
// admin > supervisor > user
const roles = (function () {
  ac.grant('user')
    .readOwn('profile', ["*", "!password"])
    .updateOwn('profile', ["*", "!role"])
    .deleteOwn('profile')
    .readAny('event')

  ac.grant("supervisor")
    .extend("user")
    .readAny("profile", ["*", "!password"]);

  ac.grant("admin")
    .extend("user")
    .extend("supervisor")
    .updateAny("profile", ["*", "!password"])
    .deleteAny("profile")
    .updateAny("event")
    .createOwn("event")
    .deleteAny("event");

  ac.lock();
  return ac;
})();

exports.roles = roles;

exports.hasPerms = function (action, resource) {
  return async (req, res, next) => {
    try {
      // Checks whether the current user has permission to perform the action
      const permission = roles.can(req.session.userInfo.role)[action](resource);
      console.log("permission.granted = ", permission.granted);
      if (!permission.granted) {
        return res.status(401).json({
          error: "You don't have enough permission to perform this action"
        });
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

// not in used
// perms = [{action, resource, id}]
// If the user has one of the options that allows access, grant him access.
exports.hasCustomPerms = function (perms) {
  return async (req, res, next) => {
    const reqUserId = req.params.id || req.body.id;
    try {
      perms.forEach(perm => {
        const permission = roles.can(req.session.userInfo.role)[perm.action](perm.resource);
        if (permission.granted && (!perm.id || req.session.userInfo._id == reqUserId))
          return next();
      });

      return res.status(401).json({
        error: "You don't have enough permission to perform this action"
      });

    } catch (error) {
      next(error)
    }
  }
}
