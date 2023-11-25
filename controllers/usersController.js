const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// Description: Gets all users
// Route: GET /users
// Access: Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
});

// Description: Create a new user
// Route: POST /users
// Access: Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  // Confirm data
  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for duplicates
  const duplicate = await User.findOne({ username }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // 10 salt round

  const userObject = { username, password: hashedPwd, roles };

  // Create and store new user
  const user = await User.create(userObject);

  if (user) {
    // Created successfully
    res.status(201).json({ message: `New user ${username} created` });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

// Description: Update a user
// Route: PATCH /users
// Access: Private
const updateUser = asyncHandler(async (req, res) => {
  const { _id, id = _id, username, roles, active, password } = req.body;

  // Confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username }).lean().exec();
  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    // Optional field to update
    // Hash password
    user.password = await bcrypt.hash(password, 10); // 10 salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
});

// Description: Delete a user
// Route: DELETE /users
// Access: Private
const deleteUser = asyncHandler(async (req, res) => {
  const { _id, id = _id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const note = await Note.findOne({ user: id }).lean().exec();
  if (note) {
    return res.status(400).json({ message: "User has assigned notes" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
