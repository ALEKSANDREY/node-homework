function register(req, res) {
    const { name, email, password } = req.body;

    // Simple validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const newUser = { name, email, password };

    // Store in global mock database
    global.users.push(newUser);
    global.user_id = newUser;

    // Return user details without password
    res.status(201).json({
        name: newUser.name,
        email: newUser.email
    });
}

function logon(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    // Find user by credentials
    const user = global.users.find(u => u.email === email && u.password === password);

    if (user) {
        global.user_id = user;
        return res.status(200).json({
            name: user.name,
            email: user.email
        });
    }

    res.status(401).json({ message: "Invalid email or password." });
}

function logoff(req, res) {
    global.user_id = null;
    res.status(200).json({ message: "Logged off successfully." });
}

module.exports = {
    register,
    logon,
    logoff
};