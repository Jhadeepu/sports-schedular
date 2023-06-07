/* eslint-disable no-unused-vars */
const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const { Sport, User, sessions } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const Sequelize = require("sequelize");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "secret-key-23456897686543",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "User not found" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
  const csrfToken = request.csrfToken();
  if (request.user) {
    return response.redirect("/sports");
  } else {
    response.render("index", {
      title: "Sports Scheduler",
      csrfToken: csrfToken,
    });
  }
});

app.get("/login", (request, response) => {
  if (request.isAuthenticated()) {
    return response.redirect("/sports");
  }
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/user", async (req, res) => {
  const { firstName, email, password, userType } = req.body;
  try {
    if (!firstName || firstName.trim().length === 0) {
      req.flash("error", "First Name cannot be empty!");
      return res.redirect("/signup");
    }
    if (!email || email.trim().length === 0) {
      req.flash("error", "Email cannot be empty!");
      return res.redirect("/signup");
    }
    if (!password || password.trim().length === 6) {
      req.flash("error", "Password cannot be empty!");
      return res.redirect("/signup");
    }
    if (!userType || (userType !== "admin" && userType !== "player")) {
      req.flash("error", "Invalid user type!");
      return res.redirect("/signup");
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash("error", "Email already registered!");
      return res.redirect("/signup");
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      firstName,
      email,
      password: hashedPassword,
      userType,
    });
    await newUser.save();
    req.login(newUser, (error) => {
      if (error) {
        console.log(error);
        req.flash("error", "An error occurred. Please try again.");
        return res.redirect("/signup");
      }
      if (userType === "admin") {
        return res.redirect("/sports"); 
      } else {
        return res.redirect("/sports/${sportId}"); 
      }
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/signup");
  }
});

app.post("/login", passport.authenticate("local", {
  successRedirect: "/sports",
  failureRedirect: "/login",
  failureFlash: true,
}));

app.get("/sports", connectEnsureLogin.ensureLoggedIn("/login"), async (request, response) => {
  const sportId = request.params.sportId;
  const account = await User.findByPk(request.user.id)
  try {
    const sports = await Sport.findAll({
      attributes: ["id", "name", "createdAt", "updatedAt"],
    });
    response.render("sports", {
      title: "Sports",
      sports: sports,
      isAdmin: account.userType,
      csrfToken: request.csrfToken(),
      sportId: sportId,
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "An error occurred. Please try again.");
    response.redirect("/login");
  }
});

app.post("/sports", connectEnsureLogin.ensureLoggedIn("/login"), async (request, response) => {
  const { name } = request.body;
  const createdBy = request.user.id;
  try {
    const Sports = await Sport.create({
      name,
      createdBy,
    });
    request.flash("success", "Sport created successfully!");
    response.redirect("/sports");
  } catch (error) {
    console.log(error);
    request.flash("error", "An error occurred. Please try again.");
    response.redirect("/login");
  }
});

app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/sport", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  response.render("create", {
    title: "Create Sport",
    csrfToken: request.csrfToken(),
  });
});

app.post("/sport", connectEnsureLogin.ensureLoggedIn("/sports"), async (request, response) => {
  const { name } = request.body;
  const createdBy = request.user.id; 

  if (name.length === 0) {
    request.flash("error", "Name cannot be empty!");
    return response.redirect("/sports");
  }
  try {
    await Sport.create({
      name,
      createdBy, 
    });
    request.flash("success", "Sport created successfully!");
    response.redirect("/sports"); 
  } catch (error) {
    console.log(error); 
    request.flash("error", "An error occurred. Please try again.");
    response.redirect("/sports");
  }
});

app.get("/sports/:sportId", connectEnsureLogin.ensureLoggedIn("/login"), async (request, response) => {
  const sportId = request.params.sportId;
  try {
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      request.flash("error", "Sport not found.");
      return response.redirect("/sports");
    }
    const createdSession = null;
    response.render("sport-page", {
      title: sport.name,
      sportId: sportId,
      sport: sport,
      session,
      createdSession,
      csrfToken: request.csrfToken(),
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "An error occurred. Please try again.");
    response.redirect("/sports");
  }
});

app.get("/sport/:sportId/session/create", connectEnsureLogin.ensureLoggedIn("/login"), async (req, res) => {
  const sportId = req.params.sportId;

  try {
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      req.flash("error", "Sport not found.");
      return res.redirect("/sports");
    }
    res.render("create-session", {
      title: "Create a New Sport Session",
      sportId: sport.id,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/sports");
  }
});

app.post("/sport/:sportId/sessions/create", connectEnsureLogin.ensureLoggedIn("/login"), async (req, res) => {
  const sportId = req.params.sportId;
  const {
    sessionDateTime,
    sessionVenue,
    sessionParticipants,
    playersNeeded
  } = req.body;
  try {
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      req.flash("error", "Sport not found.");
      return res.redirect("/sports");
    }
    const createdBy = req.user.id; 
    await sessions.create({
      sportId,
      sessionDateTime,
      sessionVenue,
      sessionParticipants,
      playersNeeded,
      createdBy, 
    });
    req.flash("success", "Session created successfully!");
    res.redirect(`/sport/${sportId}`);
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect(`/sport/${sportId}`);
  }
});

app.get("/sport/:sportId/edit", connectEnsureLogin.ensureLoggedIn("/login"), async (req, res) => {
  const sportId = req.params.sportId;
  try {
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      req.flash("error", "Sport not found.");
      return res.redirect("/sports");
    }
    res.render("edit-sport", {
      title: "Edit Sport",
      sportId: sport.id,
      sport: sport,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/sports");
  }
});

app.post("/sport/:sportId/edit", connectEnsureLogin.ensureLoggedIn("/login"), async (req, res) => {
  if (req.user.userType == 'admin') {  
    const sportId = req.params.sportId;
    const { name } = req.body;
    try {
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        req.flash("error", "Sport not found.");
        return res.redirect("/sports");
      }
      sport.name = name;
      await sport.save();
      req.flash("success", "Sport updated successfully!");
      res.redirect(`/sports/${sportId}`);
    } catch (error) {
      console.log(error);
      req.flash("error", "An error occurred. Please try again.");
      res.redirect(`/sports/${sportId}`);
    }
  }
  else {
    res.json({ "error": "Unauthorise action" })
  }
});

app.get("/sport/:id/delete", connectEnsureLogin.ensureLoggedIn("/login"), async (req, res) => {
  if (req.user.userType == 'admin') {
  try {
    await Sport.DeleteSport(req.params.id);
    res.redirect("/sports");
  } catch (error) {
    console.log(error);
  }
  }
  else {
    res.json({ "error": "Unauthorise action" })
  }
}
);

module.exports = app;
