const express = require('express');
const jwt = require('jsonwebtoken');
const { getUserModel } = require('../data_access/modelFactory');
const { hasPerms, hasCustomPerms } = require('../data_access/rbac');
const ServerSettings = require('../settings/ServerSettingsDev');
const { mapUserToClientUser, profileValidation, mapToProfileUser } = require('../validation/validationSchemasJoi');
const getStrengthPassword = require('../validation/getStrengthPassword');


const router = express.Router();

router.get('/check', (req, res) => {
  res.send({ message: "users/check all good" });
});

// #route:  POST /GetAllClientUsers
// #desc:   Get all Users
// #access: Private - with read any profile permission
router.post('/GetAllClientUsers',
  hasPerms('readAny', 'profile'),
  (async (req, res) => {
    try {
      const User = await getUserModel("user", "query");
      const users = await User.find();
      const mapedUsers = users.map(function (i) {
        return mapUserToClientUser(i);
      });

      res.json(mapedUsers);
    } catch (error) {
      console.log("Error on /GetAllClientUsers error = ", error);
      res.status(500).json({ message: "failed to get users." });
    }
  }));


// #route:  POST /GetClientUserById
// #desc:   Get User by Id
// #access: Private - with read any profile permission
router.post('/GetClientUserById',
  hasPerms('readAny', 'profile'),
  /*hasCustomPerms([
    { action: 'readOwn', resource: 'profile', id: true },
    { action: 'readAny', resource: 'profile', id: false }
  ]),*/
  (async (req, res) => {
    try {
      console.log('GetClientUserById');
      const User = await getUserModel("user", "query");
      const user = await User.findById(req.body.id);
      const mapedUser = mapUserToClientUser(user);
      res.json(mapedUser);
    } catch (error) {
      console.log("Error on /GetClientUserById: ", error);
      res.status(500).json({ message: "failed to get this user." });
    }
  }));


// #route:  POST /DeleteUser
// #desc:   Delete User
// #access: Private - with delete any profile permission
router.post('/DeleteUser',
  hasPerms('deleteAny', 'profile'),
  /*hasCustomPerms([
    { action: 'deleteOwn', resource: 'profile', id: true },
    { action: 'deleteAny', resource: 'profile', id: false }
  ]),*/
  (async (req, res) => {
    try {
      console.log('DeleteUser');
      const User = await getUserModel("user", "delete");
      const removedUser = await User.findByIdAndRemove(req.body.userId);
      console.log('removedUser = ', removedUser);
      res.json({ message: 'User has been deleted' });
    } catch (error) {
      console.log("Error on /DeleteUser: ", error);
      res.status(500).json({ message: "failed to delete this user." });
    }
  }));


// #route:  POST /UpdateUserRole
// #desc:   Update User Role
// #access: Private - with update any profile permission
router.post('/UpdateUserRole',
  hasPerms('updateAny', 'profile'),
  (async (req, res) => {
    try {
      console.log('UpdateUserRole');
      clientUser = req.body;
      const User = await getUserModel("user", "update");
      const updatedUser = await User.updateOne(
        { _id: clientUser.id },
        { $set: { role: clientUser.role } }
      );
      res.json(updatedUser._id);
    } catch (error) {
      console.log("Error on /UpdateUserRole: ", error);
      res.status(500).json({ message: "failed to update this user." });
    }
  }));


// #route:  POST /UpdateUserProfile
// #desc:   Update User Profile
// #access: Private - with update Own profile permission
router.post('/UpdateUserProfile',
  hasPerms('updateOwn', 'profile'),
  (async (req, res) => {
    try {
      const User = await getUserModel("user", "update");
      const { firstName, lastName, username, } = req.body;
      const profile = { firstName, lastName, username };
      const userId = req.session.userInfo._id;

      const validationError = profileValidation(profile);
      if (validationError)
        return res.status(400).send(validationError);

      const user = await User.findById(userId);
      if (!user) return res.sendStatus(400);

      const updatedUser = await User.updateOne(
        { _id: userId },
        { $set: { firstName, lastName, username } }
      );
      console.log('updatedUser = ', updatedUser);

      return res.json({ firstName, lastName, username });

    } catch (error) {
      console.log("Error on /user/UpdateUserProfile: ", error);
      res.status(500).send("There was an error attempting to update the profile. Please try again later.");
    }
  }));


// #route:  POST /UpdateUserEmail/
// #desc:   Update User Email
// #access: Private - with update Own profile permission
router.post("/UpdateUserEmail",
  hasPerms('updateOwn', 'profile'),
  async (req, res) => {
    try {
      const User = await getUserModel("user", "update");

      const { email, password } = req.body;
      const userId = req.session.userInfo._id;

      if (!email) return res.status(400).send("Please provide your new email address!");
      if (!password) return res.status(400).send("Please provide your password!");

      const user = await User.findById(userId);
      if (!user) return res.sendStatus(400);

      const validPassword = await user.passwordIsValid(profile.password);
      if (!validPassword) return res.status(400).send("password is invalid!");

      const updatedUser = await User.updateOne(
        { _id: userId }, { $set: { email } });

      console.log('updatedUser = ', updatedUser);

      res.json({ success: true, email });

    } catch (error) {
      console.log("Error on /user/UpdateUserEmail: ", error);
      res.status(400).send("something went wrong. Please try again!");
    }
  });

// #route:  POST /DeleteUserAccount
// #desc:   Delete User Account
// #access: private - with delete Own profile permission
router.post("/DeleteUserAccount",
  hasPerms('deleteOwn', 'profile'),
  async (req, res) => {
    try {
      const User = await getUserModel("user", "delete");

      const { password } = req.body;
      const userId = req.session.userInfo._id;

      if (!password) return res.status(400).send("Please provide your password!");

      const user = await User.findById(userId);
      if (!user) return res.sendStatus(400);

      const validPassword = await user.passwordIsValid(password);
      if (!validPassword) return res.status(400).send("password is invalid!");

      const deletedUser = await user.remove();

      console.log('deletedUser = ', deletedUser);

      res.json({ success: true });

    } catch (error) {
      console.log("Error on /user/DeleteUserAccount: ", error);
      res.status(400).send("something went wrong. Please try again!");
    }
  });


// #route:  POST /UpdateUserPassword
// #desc:   Update User Password
// #access: private - with update Own profile permission
router.post('/UpdateUserPassword',
  hasPerms('updateOwn', 'profile'),
  (async (req, res) => {
    console.log('in UpdateUserPassword');
    try {

      const User = await getUserModel("user", "update");
      const { password, newPassword, newPassword2 } = req.body;
      const userId = req.session.userInfo._id;

      if (!password || !newPassword || !newPassword2 ||
        newPassword != newPassword2 || password == newPassword)
        return res.sendStatus(400);

      const user = await User.findById(userId);
      if (!user) res.sendStatus(400);

      const profile = {
        firstName: user.firstName, lastName: user.lastName,
        username: user.username, email: user.email
      };

      const passwordScore = getStrengthPassword(newPassword, profile);
      if (passwordScore < ServerSettings.minPasswordScoreRequired) {
        return res.status(400).json({
          message: "The new password is too weak.",
          passwordScore
        });
      }

      const validPassword = await user.passwordIsValid(password);
      if (!validPassword) return res.status(400).send("password is invalid!");

      user.password = newPassword;
      const updatedUser = await user.save();
      console.log('updatedUser = ', updatedUser);

      return res.json({ success: true });

    } catch (error) {
      console.log("Error on /user/UpdateUserPassword: ", error);
      res.status(400).send("something went wrong. Please try again!");
    }
  }));


module.exports = router;
