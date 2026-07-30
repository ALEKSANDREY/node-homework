// controllers/userController.js

const register = (req, res) => {
    const { name, email, password } = req.body || {};

    const newUser = {
        id: global.users.length + 1,
        name,
        email,
        password,
    };

    global.users.push(newUser);

    // Reviewer requirement: set global.user_id to the user object, not an integer ID
    global.user_id = newUser;

    return res.status(201).json({
        name: newUser.name,
        email: newUser.email,
    });
};

const logon = (req, res) => {
    const { email, password } = req.body || {};

    const user = global.users.find(
        (u) => u.email === email && u.password === password
    );

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Reviewer requirement: set global.user_id to the logged-in user object
    global.user_id = user;

    return res.status(200).json({
        name: user.name,
        email: user.email,
    });
};

const logoff = (req, res) => {
    global.user_id = null;
    // Reviewer requirement: return ONLY status 200 without a JSON body
    return res.sendStatus(200);
};

module.exports = {
    register,
    logon,
    logoff,
};