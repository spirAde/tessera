import {
  Association,
  CreationOptional,
  DataTypes,
  HasManyGetAssociationsMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Optional,
} from 'sequelize';

import { sequelize } from '../lib/sequelize';
import { Page } from './Page.model';
import { Stage, Status } from '../types';

export interface BuildAttributes {
  id: number;
  stage: Stage;
  status: Status;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

type BuildAttributesWithDefaultValue = 'id' | 'createdAt' | 'updatedAt';
type BuildAttributesNullable = 'deletedAt';

export type BuildAttributesNew = Optional<
  BuildAttributes,
  BuildAttributesNullable | BuildAttributesWithDefaultValue
>;

export class Build extends Model<BuildAttributes, BuildAttributesNew> implements BuildAttributes {
  readonly id!: number;

  readonly createdAt!: string;
  readonly updatedAt!: string;
  readonly deletedAt!: string | null;

  readonly stage!: Stage;
  readonly status!: Status;

  readonly pages?: Page[];
  readonly getPages!: HasManyGetAssociationsMixin<Page>;
}

Build.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      defaultValue: Stage.idle,
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
    tableName: 'builds',
    name: { singular: 'build', plural: 'builds' },
    paranoid: true,
  },
);
