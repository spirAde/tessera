import { Association, BelongsToGetAssociationMixin, DataTypes, Model, Optional } from 'sequelize';

import { Page } from './Page.model';
import { Pipeline } from './Pipeline.model';
import { sequelize } from '../lib/sequelize';
import { Status } from '../types';

export type PageSnapshotAttributes = {
  id: number;
  pipelineId: number;
  pageId: number;
  status: Status | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type PageSnapshotAttributesWithDefaultValue = 'id' | 'createdAt' | 'updatedAt';
type PageSnapshotAttributesNullable = 'deletedAt';

export type PageSnapshotAttributesNew = Optional<
  PageSnapshotAttributes,
  PageSnapshotAttributesNullable | PageSnapshotAttributesWithDefaultValue
>;

export class PageSnapshot
  extends Model<PageSnapshotAttributes, PageSnapshotAttributesNew>
  implements PageSnapshotAttributes
{
  static page: Association<PageSnapshot, Page>;
  static pipeline: Association<PageSnapshot, Pipeline>;

  static associate() {
    this.page = this.belongsTo(Page);
    this.pipeline = this.belongsTo(Pipeline);
  }

  readonly id!: number;

  readonly createdAt!: string;
  readonly updatedAt!: string;
  readonly deletedAt!: string | null;

  readonly pipelineId!: number;
  readonly pageId!: number;
  readonly status!: Status;

  readonly page!: Page;
  readonly getPage!: BelongsToGetAssociationMixin<Page>;

  readonly pipeline?: Pipeline;
  readonly getPipeline!: BelongsToGetAssociationMixin<Pipeline>;
}

PageSnapshot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    pipelineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pageId: {
      type: DataTypes.INTEGER,
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
    tableName: 'pageSnapshots',
    name: { singular: 'pageSnapshot', plural: 'pageSnapshots' },
    paranoid: true,
  },
);
