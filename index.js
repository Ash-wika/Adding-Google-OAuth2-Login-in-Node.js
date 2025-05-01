require('dotenv').config();

const express = require('express'); // to create the server
const passport = require('passport'); // for authentication purpose
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// create the session
const app = express();
// for session management we will use middleware 
app.use(
    session({
        secret: "secret",// secret key to encrypt session
        resave: false, // took default because we want to avoid resaving session if nothing has saved
        saveUninitialized: true // save new empty sessions
    })
);

// initialize passport and let it manage authentication in our app
app.use(passport.initialize()); // just initialize
app.use(passport.session()); // this line makes sure it integrates with express session.. so user will be still logged in as they browse our site

// so we will now configure google strategy in passport to use credential we just added--- for that use passport middleware
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:5000/auth/google/callback'
    },
        (accessToken, refreshToken, profile, done) => { // done function
            return done(null, profile);
        }
    ));

// now we have to tell passport how to serialize and deserialize users-- necessary for session management
// serialize means saving the data inside the session
// deserialize means retrieving the data when needed

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const baseHTML = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Google OAuth App</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f8f9fa, #e0e0e0);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
            text-align: center;
        }
        a {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4285F4;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        a:hover {
            background-color: #357ae8;
        }
        h1 {
            margin-bottom: 20px;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        ${body}
    </div>
</body>
</html>
`;

// endpoints
app.get("/", (req, res) => {
    res.send(baseHTML("<h1>Login Page</h1><a href='/auth/google'>Login with Google</a>"));
});

app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile", "email"] })
);


//once user logged in successfully Google will redirect back to our app using the callback URL
app.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: "/" }), (req, res) => {
    res.redirect('/profile');
});

app.get("/profile", (req, res) => {
    const name = req.user.displayName;
    const email = req.user.emails[0].value;

    const profileHTML = `
    <h1>Welcome, ${name}</h1>
    <p>Email: ${email}</p>
    <br />
    <a href="/logout">Logout</a>
`;
    res.send(baseHTML(profileHTML));
});

app.get("/logout", (req, res) => {
    req.logOut(() => {
        res.redirect("/");
    });

});

app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});