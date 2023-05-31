/* eslint-disable no-unused-vars */
const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const { Sport, User } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require(`path`);

const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const Sequelize = require("sequelize");


const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const flash = require("connect-flash");
const { error } = require("console");
//const user = require("./models");

const saltRounds = 10 ;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long",["POST", "PUT", "DELETE"]));
app.use(flash());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.set("views", path.join(__dirname, "views"));

app.use(session({
  secret: "secret-key-23456897686543",
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  },
   resave: false,
   saveUninitialized: true,
}))
app.use(passport.initialize())
app.use(passport.session())

app.use(function(request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(new LocalStrategy ({
  usernameField: "email",
  passwordField: "password"
}, (username,password,done) => {
  User.findOne({ where:{ email: username }})
    .then(async(user) => {
      const result = await bcrypt.compare(password, user.password)
      if (result) {
        return done(null, user)
      } else {
        return done(null , false , {message:"Invalid Password"})
      }
    }).catch(() => {
      return done(null , false , {message:"user not exist"})
    })
}))

passport.serializeUser((user, done) => {
  console.log("serializing user in session", user.id)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
  .then(user => {
    done(null, user)
  })
  .catch(error => {
    done(error, null)
  })
})

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


app.get("/login", (request, response, next) => {
  if (request.isAuthenticated()) {
    return response.redirect("/sports");
  }

  response.render("login", { 
    title: "Login", 
    csrfToken: request.csrfToken()
  });
});



app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken()
  });
});

app.post("/user", async (request, response) => {
  if (request.body.firstName.length == 0) {
    request.flash("error", "First Name cannot be empty!");
    return response.redirect("/signup");
  }
  if (request.body.lastName.length == 0) {
    request.flash("error", "Last Name cannot be empty!");
    return response.redirect("/signup");
  }
  if (request.body.email.length == 0) {
    request.flash("error", "Email cannot be empty!");
    return response.redirect("/signup");
  }
  if (request.body.password.length < 6) {
    request.flash("error", "Password should be a minimum of 6 characters long!");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  console.log("Firstname", request.body.firstName);
  try {
    const { firstName, lastName, email, isAdmin } = request.body;

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPwd,
      isAdmin: isAdmin || false,
    });

    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/sports");
    });
  } catch (error) {
    request.flash("error", "Email already in use. Please sign up with a different email.");
    return response.redirect("/signup");
  }
});


// app.post("/user", async (request, response) => {
//   if (request.body.firstName.length == 0) {
//     request.flash("error", "First Name cannot be empty!");
//     return response.redirect("/signup");
//   }
//   if (request.body.lastName.length == 0) {
//     request.flash("error", "Last Name cannot be empty!");
//     return response.redirect("/signup");
//   }
//   if (request.body.email.length == 0) {
//     request.flash("error", "Email cannot be empty!");
//     return response.redirect("/signup");
//   }
//   if (request.body.password.length < 6) {
//     request.flash("error", "Password should be a minimum of 6 characters long!");
//     return response.redirect("/signup");
//   }
//   const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
//   console.log(hashedPwd);
//   console.log("Firstname", request.body.firstName);
//   try {
//     const user = await User.create({
//       firstName: request.body.firstName,
//       lastName: request.body.lastName,
//       email: request.body.email,
//       password: hashedPwd,
//       isAdmin: false, 
//     });
//     request.login(user, (err) => {
//       if (err) {
//         console.log(err);
//       }
//       response.redirect("/sports");
//     });
//   } catch (error) {
//     request.flash("error", "Email already in use. Please sign up with a different email.");
//     return response.redirect("/signup");
//   }
// });


app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.post("/login", passport.authenticate("local", {
  successRedirect: "/sports",
  failureRedirect: "/login",
  failureFlash: true,
}));

// Admin route
app.get("/admin", (request, response) => {
  response.render("admin-login", { title: "Admin Login", csrfToken: request.csrfToken() });
});

app.post("/admin", passport.authenticate("local", {
  successRedirect: "/admin/dashboard",
  failureRedirect: "/admin",
  failureFlash: true,
}));



app.get(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log(request.user.id);
    try {
      const loggedInPlayer = request.user.id;
      const player = await User.findByPk(loggedInPlayer);
      const playerName = player.dataValues.name;
      const allSports = await Sport.getSports(loggedInPlayer);
      const userRole = player.dataValues.role;
      console.log(userRole);
      if (request.accepts("html")) {
        response.render("sports", {
          title: "Sports Page",
          playerName,
          allSports,
          userRole,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({ allSports });
      }
    } catch (error) {
      console.log(error);
    }
  }
);
  


module.exports = app;