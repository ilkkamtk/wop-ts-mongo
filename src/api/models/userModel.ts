// mongoose schema for user
// intface User is located in src/interfaces/User.ts

import mongoose from 'mongoose';
import {User} from '../../interfaces/User';

const userModel = new mongoose.Schema<User>({
  user_name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
  },
  password: {
    type: String,
    required: true,
  },
});

export default mongoose.model<User>('User', userModel);
