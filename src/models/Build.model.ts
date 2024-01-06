import { DataTypes, HasManyGetAssociationsMixin, Model, Optional } from 'sequelize';

import { sequelize } from '../lib/sequelize';
import { Page } from './Page.model';
import { Stage, Status } from '../types';

export interface BuildAttributes {
  id: number;
  stage: Stage | null;
  status: Status | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

type BuildAttributesWithDefaultValue = 'id' | 'createdAt' | 'updatedAt';
type BuildAttributesNullable = 'deletedAt' | 'stage' | 'status';

export type BuildAttributesNew = Optional<
  BuildAttributes,
  BuildAttributesNullable | BuildAttributesWithDefaultValue
>;

export class Build extends Model<BuildAttributes, BuildAttributesNew> implements BuildAttributes {
  readonly id!: number;

  readonly createdAt!: string;
  readonly updatedAt!: string;
  readonly deletedAt!: string | null;

  readonly stage!: Stage | null;
  readonly status!: Status | null;

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
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM,
      values: Object.values(Status),
      validate: { isIn: [Object.values(Status)] },
      allowNull: true,
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
