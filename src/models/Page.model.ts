import { DataTypes, Model, Optional, HasManyGetAssociationsMixin, Association } from 'sequelize';

import { PageSnapshot } from './PageSnapshot.model';
import { sequelize } from '../lib/sequelize';

export type PageAttributes = {
  id: number;
  url: string;
  externalId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type PageAttributesWithDefaultValue = 'id' | 'createdAt' | 'updatedAt';
type PageAttributesNullable = 'deletedAt';

export type PageAttributesNew = Optional<
  PageAttributes,
  PageAttributesNullable | PageAttributesWithDefaultValue
>;

export class Page extends Model<PageAttributes, PageAttributesNew> implements PageAttributes {
  static pageSnapshots: Association<Page, PageSnapshot>;

  static associate() {
    this.pageSnapshots = this.hasMany(PageSnapshot);
  }

  readonly id!: number;

  readonly createdAt!: string;
  readonly updatedAt!: string;
  readonly deletedAt!: string | null;

  readonly url!: string;
  readonly externalId!: number;

  readonly pageSnapshots?: PageSnapshot[];
  readonly getPageSnapshots!: HasManyGetAssociationsMixin<PageSnapshot>;
}

Page.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    externalId: {
      type: DataTypes.INTEGER,
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
    tableName: 'pages',
    name: { singular: 'page', plural: 'pages' },
    paranoid: true,
  },
);
