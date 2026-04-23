const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginAdmin,
  loginUser,
} = require("../controllers/userController");

router.post("/login/admin", loginAdmin);
router.post("/login/user", loginUser);

router.route("/").get(getUsers).post(createUser);
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
