/* eslint-disable no-unused-vars */
const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const { Sport, User, Sessions } = require("./models");
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
const { error } = require("console");

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

app.post("/user", async (request, response) => {
  const { firstName, lastName, email, password, isAdmin } = request.body;

  if (firstName.length === 0) {
    request.flash("error", "First Name cannot be empty!");
    return response.redirect("/signup");
  }
  if (lastName.length === 0) {
    request.flash("error", "Last Name cannot be empty!");
    return response.redirect("/signup");
  }

  if (email.length === 0) {
    request.flash("error", "Email cannot be empty!");
    return response.redirect("/signup");
  }

  if (password.length === 0) {
    request.flash("error", "Password cannot be empty!");
    return response.redirect("/signup");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false,
    });

    request.login(user, (error) => {
      if (error) {
        console.log(error);   
      }
      response.redirect("/sports");
    })
  } catch (error) {
    console.log(error);
    request.flash("error", "An error occurred. Please try again.");
    response.redirect("/signup");
  }
});

app.post("/login", passport.authenticate("local", {
  successRedirect: "/sports",
  failureRedirect: "/login",
  failureFlash: true,
}));

app.get("/sports", connectEnsureLogin.ensureLoggedIn("/login"), async (request, response) => {
  try {
    const sports = await Sport.findAll({
      attributes: ["id", "name", "createdAt", "updatedAt"],
    });
    response.render("sports", {
      title: "Sports",
      sports: sports,
      csrfToken: request.csrfToken(),
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "An error occurred. Please try again.");
    response.redirect("/login");
  }
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
const sessions = await Session.findAll({ where: { sportId } });
const createdSession = null;

response.render("sport-page", {
  title: sport.name,
  sportId: sportId,
  sport: sport,
  sessions,
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

    await Session.create({
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





app.get("/sport/:sportId/sessions/:sessionId/edit", connectEnsureLogin.ensureLoggedIn("/login"), async (req, res) => {
  const sportId = req.params.sportId;
  const sessionId = req.params.sessionId;

  try {
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      req.flash("error", "Sport not found.");
      return res.redirect("/sports");
    }

    const session = await Session.findByPk(sessionId, { include: User }); 
    if (!session) {
      req.flash("error", "Session not found.");
      return res.redirect(`/sport/${sportId}`);
    }

    res.render('edit-session', {
      title: 'Edit Session',
      sport: sport, 
      sportId: req.params.sportId,
      session: session,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect(`/sport/${sportId}`);
  }
});


app.post("/sport/:sportId/sessions/:sessionId/edit", connectEnsureLogin.ensureLoggedIn("/login"), async (req, res) => {
  const sportId = req.params.sportId;
  const sessionId = req.params.sessionId;
  const {
    sessionDateTime,
    sessionVenue,
    sessionParticipants,
    playersNeeded
  } = req.body;

  try {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      req.flash("error", "Session not found.");
      return res.redirect(`/sport/${sportId}`);
    }

    await session.update({
      sessionDateTime,
      sessionVenue,
      sessionParticipants,
      playersNeeded
    });

    req.flash("success", "Session updated successfully!");
    res.redirect(`/sport/${sportId}`);
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect(`/sport/${sportId}`);
  }
});

app.post("/sport/:sportId/sessions/:sessionId/delete", connectEnsureLogin.ensureLoggedIn("/login"), async (req, res) => {
  const sportId = req.params.sportId;
  const sessionId = req.params.sessionId;

  try {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      req.flash("error", "Session not found.");
      return res.redirect(`/sport/${sportId}`);
    }

    await session.destroy();

    req.flash("success", "Session deleted successfully!");
    res.redirect(`/sport/${sportId}`);
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect(`/sport/${sportId}`);
  }
});
module.exports = app;
