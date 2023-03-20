import {User} from './User';
import {Types, Document} from 'mongoose';
import {Point} from 'geojson';

interface Cat extends Document {
  cat_name: string;
  weight: number;
  owner: Types.ObjectId | User;
  filename: string;
  birthdate: Date;
  location: Point;
}

type CatTest = Partial<Cat>;

export {Cat, CatTest};
