import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import bcrypt from 'bcryptjs';
import {User} from '../../interfaces/User';
import userModel from '../models/userModel';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {validationResult} from 'express-validator';

const salt = bcrypt.genSaltSync(12);

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userModel.find().select('-password -role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      console.log('cat_post validation', messages);
      next(new CustomError(messages, 400));
      return;
    }

    const user = await userModel
      .findById(req.params.id)
      .select('-password -role');
    if (user) {
      res.json(user);
    } else {
      throw new CustomError('User not found', 404);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('userPost', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      console.log('cat_post validation', messages);
      next(new CustomError(messages, 400));
      return;
    }

    const user = req.body;
    user.role = 'user';
    user.password = bcrypt.hashSync(user.password!, salt);
    const newUser = await userModel.create(user);
    const response: DBMessageResponse = {
      message: 'user created',
      data: {
        user_name: newUser.user_name,
        email: newUser.email,
        _id: newUser._id,
      },
    };
    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const userPutCurrent = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      console.log('cat_post validation', messages);
      next(new CustomError(messages, 400));
      return;
    }

    const user = req.body;
    const result = await userModel
      .findByIdAndUpdate((req.user as User)._id, user, {
        new: true,
      })
      .select('-password -role');
    if (result) {
      const response: DBMessageResponse = {
        message: 'user created',
        data: result,
      };
      res.json(response);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      console.log('cat_post validation', messages);
      next(new CustomError(messages, 400));
      return;
    }

    const result = await userModel
      .findByIdAndDelete((req.user as User)._id)
      .select('-password -role');
    if (result) {
      const response: DBMessageResponse = {
        message: 'user created',
        data: result,
      };
      res.json(response);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new CustomError('token not valid', 403));
  } else {
    res.json({
      _id: (req.user as User)._id,
      user_name: (req.user as User).user_name,
      email: (req.user as User).email,
    });
  }
};

export {
  userListGet,
  userGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
