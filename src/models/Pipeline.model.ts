import { Association, DataTypes, HasManyGetAssociationsMixin, Model, Optional } from 'sequelize';

import { PageSnapshot } from './PageSnapshot.model';
import { sequelize } from '../lib/sequelize';
import { Stage, Status } from '../types';

export type PipelineAttributes = {
  id: number;
  jobId: string;
  stage: Stage | null;
  status: Status | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type PipelineAttributesWithDefaultValue = 'id' | 'createdAt' | 'updatedAt';
type PipelineAttributesNullable = 'deletedAt';

export type PipelineAttributesNew = Optional<
  PipelineAttributes,
  PipelineAttributesNullable | PipelineAttributesWithDefaultValue
>;

export class Pipeline
  extends Model<PipelineAttributes, PipelineAttributesNew>
  implements PipelineAttributes
{
  static pageSnapshots: Association<Pipeline, PageSnapshot>;

  static associate() {
    this.pageSnapshots = this.hasMany(PageSnapshot);
  }

  readonly id!: number;

  readonly createdAt!: string;
  readonly updatedAt!: string;
  readonly deletedAt!: string | null;

  readonly jobId!: string;
  readonly stage!: Stage;
  readonly status!: Status;

  readonly pageSnapshots?: PageSnapshot[];
  readonly getPageSnapshots!: HasManyGetAssociationsMixin<PageSnapshot>;
}

Pipeline.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    jobId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stage: {
      type: DataTypes.ENUM,
      values: Object.values(Stage),
      validate: { isIn: [Object.values(Stage)] },
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      values: Object.values(Status),
      validate: { isIn: [Object.values(Status)] },
      allowNull: false,
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
    tableName: 'pipelines',
    name: { singular: 'pipeline', plural: 'pipelines' },
    paranoid: true,
  },
);
