import {
  Association,
  DataTypes,
  Model,
  BelongsToGetAssociationMixin,
  BelongsToMany,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  Optional,
} from 'sequelize';

import { sequelize } from '../lib/sequelize';
import { Build } from './Build.model';
import { Stage, Status } from '../types';

export interface PageAttributes {
  id: number;
  buildId: number;
  url: string;
  stage: Stage;
  status: Status;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

type PageAttributesWithDefaultValue = 'id' | 'createdAt' | 'updatedAt';
type PageAttributesNullable = 'deletedAt';

export type PageAttributesNew = Optional<
  PageAttributes,
  PageAttributesNullable | PageAttributesWithDefaultValue
>;

export class Page extends Model<PageAttributes, PageAttributesNew> implements PageAttributes {
  readonly id!: number;

  readonly createdAt!: string;
  readonly updatedAt!: string;
  readonly deletedAt!: string | null;

  readonly buildId!: number;
  readonly url!: string;
  readonly stage!: Stage;
  readonly status!: Status;

  readonly build?: Build;
  readonly getBuild!: BelongsToGetAssociationMixin<Build>;
}

Page.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    buildId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stage: {
      type: DataTypes.ENUM,
      values: Object.values(Stage),
      validate: { isIn: [Object.values(Stage)] },
      allowNull: false,
      defaultValue: Stage.idle,
    },
    status: {
      type: DataTypes.ENUM,
      values: Object.values(Status),
      validate: { isIn: [Object.values(Status)] },
      allowNull: false,
      defaultValue: Status.idle,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'pages',
    name: { singular: 'page', plural: 'pages' },
    paranoid: true,
  },
);
