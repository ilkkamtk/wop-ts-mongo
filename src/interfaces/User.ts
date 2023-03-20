import {Document} from 'mongoose';
interface User extends Document {
  user_name: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
}

interface UserOutput {
  _id: string;
  user_name: string;
  email: string;
}

type UserTest = Partial<User>;

interface LoginUser {
  user_name: string;
  email: string;
  role: 'user' | 'admin';
}

export {User, UserOutput, UserTest, LoginUser};
