import passport from 'passport';
import {Strategy} from 'passport-local';
import {Strategy as JWTStrategy, ExtractJwt} from 'passport-jwt';
import bcrypt from 'bcryptjs';
import userModel from '../../src/api/models/userModel';
import {LoginUser} from '../interfaces/User';

passport.use(
  new Strategy(async (username, password, done) => {
    try {
      console.log(username, password);
      const user = await userModel.findOne({email: username});
      console.log('strategy', user);
      if (user === null || !user) {
        return done(null, false);
      }
      console.log('truevai', bcrypt.compareSync(password, user.password!));

      if (!bcrypt.compareSync(password, user.password!)) {
        return done(null, false);
      }
      // convert user to plain object to get rid of binary row type
      const loginUser: LoginUser = user.toObject();
      return done(null, loginUser, {message: 'Logged In Successfully'}); // use spread syntax to create shallow copy to get rid of binary row type
    } catch (err) {
      return done(err);
    }
  })
);

// TODO: JWT strategy for handling bearer token
// consider .env for secret, e.g. secretOrKey: process.env.JWT_SECRET
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'asdf',
    },
    (jwtPayload, done) => {
      // console.log('payload', jwtPayload);
      done(null, jwtPayload);
    }
  )
);

export default passport;
