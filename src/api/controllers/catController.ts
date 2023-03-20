import {Request, Response, NextFunction} from 'express';
import {Cat} from '../../interfaces/Cat';
import {User} from '../../interfaces/User';
import CustomError from '../../classes/CustomError';
import {validationResult} from 'express-validator';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import catModel from '../models/catModel';
import {Point} from 'geojson';
import path from 'path';
import rectangleBounds from '../../utils/rectangleBounds';

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await catModel.find().populate('owner', 'user_name email');
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const catGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }
    const cat = await catModel
      .findById(req.params.id)
      .populate('owner', 'user_name email');
    if (cat) {
      res.json(cat);
    } else {
      throw new CustomError('Cat not found', 404);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const catPost = async (
  req: Request<{}, {}, Cat, {}, {coords: Point}>,
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
      next(new CustomError(messages, 400));
      return;
    }

    if (!req.file) {
      const err = new CustomError('file not valid', 400);
      throw err;
    }

    const cat = req.body;
    cat.owner = (req.user as User)._id;
    cat.filename = req.file.filename;
    cat.location = res.locals.coords;

    const newCat = await catModel.create(cat);
    await newCat.populate('owner', 'user_name email');
    const response: DBMessageResponse = {
      message: 'cat created',
      data: newCat,
    };
    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Cat>,
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
      next(new CustomError(messages, 400));
      return;
    }

    const cat = req.body;
    const result = await catModel
      .findOneAndUpdate(
        {_id: req.params.id, owner: (req.user as User)._id},
        cat,
        {
          new: true,
        }
      )
      .populate('owner', 'user_name email');
    if (result) {
      const message: DBMessageResponse = {
        message: 'cat updated',
        data: result,
      };
      res.json(message);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const catDelete = async (
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
      next(new CustomError(messages, 400));
      return;
    }

    const result = await catModel
      .findOneAndDelete({
        _id: req.params.id,
        owner: (req.user as User)._id,
      })
      .populate('owner', 'user_name email');
    if (result) {
      const message: DBMessageResponse = {
        message: 'cat deleted',
        data: result,
      };
      res.json(message);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
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
      next(new CustomError(messages, 400));
      return;
    }
    const {topRight, bottomLeft} = req.query;

    const rightCorner = {
      lat: parseFloat(topRight.split(',')[0]),
      lng: parseFloat(topRight.split(',')[1]),
    };

    const leftCorner = {
      lat: parseFloat(bottomLeft.split(',')[0]),
      lng: parseFloat(bottomLeft.split(',')[1]),
    };

    const bounds = rectangleBounds(rightCorner, leftCorner);

    const cats = await catModel.find({
      location: {
        $geoWithin: {
          $geometry: bounds,
        },
      },
    });
    console.log(cats);
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const catGetByUser = async (
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
      next(new CustomError(messages, 400));
      return;
    }
    console.log('first', req.user);
    const cats = await catModel
      .find({owner: (req.user as User)._id})
      .populate('owner', 'user_name email');
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat>,
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
      next(new CustomError(messages, 400));
      return;
    }

    if ((req.user as User).role !== 'admin') {
      throw new CustomError('Admin only', 403);
      return;
    }

    const cat = req.body;
    const result = await catModel.findOneAndUpdate({_id: req.params.id}, cat, {
      new: true,
    });
    if (result) {
      const message: DBMessageResponse = {
        message: 'cat updated',
        data: result,
      };
      res.json(message);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

const catDeleteAdmin = async (
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
      next(new CustomError(messages, 400));
      return;
    }

    if ((req.user as User).role !== 'admin') {
      throw new CustomError('Admin only', 403);
      return;
    }

    const result = await catModel.findOneAndDelete({
      _id: req.params.id,
    });
    if (result) {
      const message: DBMessageResponse = {
        message: 'cat deleted',
        data: result,
      };
      res.json(message);
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

export {
  catListGet,
  catGet,
  catPost,
  catPut,
  catDelete,
  catGetByBoundingBox,
  catGetByUser,
  catDeleteAdmin,
  catPutAdmin,
};
