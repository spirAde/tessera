import { Op } from 'sequelize';

import { PageSnapshot, PageSnapshotAttributes, PageSnapshotAttributesNew } from '../../models';
import { Status } from '../../types';

type PageSnapshotUpdate = Partial<PageSnapshotAttributes>;

export function createPageSnapshot(values: PageSnapshotAttributesNew): Promise<PageSnapshot> {
  return PageSnapshot.create(values);
}

export function updatePageSnapshot(
  pageSnapshot: PageSnapshot,
  values: PageSnapshotUpdate,
): Promise<PageSnapshot> {
  return pageSnapshot.update(values);
}

export function getLastPageSnapshot(pageId: number): Promise<PageSnapshot> {
  return PageSnapshot.findOne({
    where: { pageId, status: { [Op.ne]: Status.failed } },
    order: [['id', 'DESC']],
    rejectOnEmpty: true,
  });
}
