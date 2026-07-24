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
    global.user_id = newUser.id;

    // Return only name and email per reviewer instructions
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

    global.user_id = user.id;

    return res.status(200).json({
        name: user.name,
        email: user.email,
    });
};

const logoff = (req, res) => {
    global.user_id = null;
    return res.status(200).json({ message: "Logged off successfully" });
};

module.exports = {
    register,
    logon,
    logoff,
};