/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Stack, DocumentCard, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, FC, useState } from 'react'

import { Pagination, useQueryString, useToggleState, ContentCard, Empty } from '@perfsee/components'
import { SnapshotTrigger } from '@perfsee/schema'

import { Breadcrumb } from '../../components'
import { useBreadcrumb } from '../../shared'
import { SnapshotFilters, CreateSnapshot } from '../operator-comps/'
import { SnapshotTitle } from '../style'

import { SnapshotDrawer } from './drawer'
import { LabListModule, SnapshotSchema, ReportsPayload, SNAPSHOT_PAGE_SIZE } from './module'
import { CardsShimmer } from './shimmer'
import { SnapshotMeta } from './snapshot-meta'
import { SnapshotStatusTag } from './status-tag'
import { cardStyle, SnapshotListWrap, SnapshotCardHeader } from './style'

const tokens = {
  padding: '20px 0',
}

export const PaginationSnapshotList = () => {
  const [{ totalCount, loading }, dispatcher] = useModule(LabListModule)
  const breadcrumbItems = useBreadcrumb({ snapshotsPage: true })

  const [{ page = 1, trigger }, updateQueryString] = useQueryString<{
    page: number
    trigger: SnapshotTrigger
  }>()

  const noFilter = !trigger

  const onPageChange = useCallback(
    (page: number) => {
      updateQueryString({
        page,
      })
    },
    [updateQueryString],
  )

  const onTriggerFilterChange = useCallback(
    (value: string) => {
      updateQueryString({
        page: 1,
        trigger: value as SnapshotTrigger,
      })
    },
    [updateQueryString],
  )

  const onRenderHeader = useCallback(() => {
    return (
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { flexGrow: 1 } }}>
        <span>Lab Reports</span>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '16px' }}>
          <SnapshotFilters trigger={trigger} onChangeTrigger={onTriggerFilterChange} />
          <CreateSnapshot />
        </Stack>
      </Stack>
    )
  }, [onTriggerFilterChange, trigger])

  useEffect(() => {
    dispatcher.getSnapshots({
      trigger,
      pageNum: page,
      pageSize: SNAPSHOT_PAGE_SIZE,
    })
  }, [dispatcher, trigger, page])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher])

  return (
    <Stack>
      <Breadcrumb items={breadcrumbItems} />
      <ContentCard title="Lab Report" onRenderHeader={onRenderHeader}>
        {!loading && totalCount === 0 && noFilter ? (
          <Empty title={'No Snapshot found'} />
        ) : (
          <>
            <SnapshotList trigger={trigger} />
            <Pagination
              page={page}
              total={totalCount}
              pageSize={SNAPSHOT_PAGE_SIZE}
              onChange={onPageChange}
              hideOnSinglePage={true}
            />
          </>
        )}
      </ContentCard>
    </Stack>
  )
}

type Props = {
  trigger?: SnapshotTrigger
}

const SnapshotList: FC<Props> = (props) => {
  const [{ snapshots, reportsWithId, loading }, dispatcher] = useModule(LabListModule)

  const [panelVisible, showPanel, hidePanel] = useToggleState(false)
  const [activeSnapshotId, setActiveSnapshotId] = useState<number | null>(null)

  const onClickItem = useCallback(
    (item: SnapshotSchema) => {
      setActiveSnapshotId(item.id)
      showPanel()

      const snapshotId = item.id
      const reports = (reportsWithId[snapshotId] as ReportsPayload<false>)?.reports
      if (!reports?.length) {
        dispatcher.getSnapshotReports(snapshotId)
      }
    },
    [dispatcher, reportsWithId, showPanel],
  )

  if (loading) {
    return <CardsShimmer size={SNAPSHOT_PAGE_SIZE} />
  }

  if (!snapshots?.length) {
    if (props.trigger) {
      return (
        <Stack tokens={tokens} horizontalAlign="center">
          No snapshot created by {props.trigger}
        </Stack>
      )
    }

    return (
      <Stack tokens={tokens} horizontalAlign="center">
        No snapshot data.
      </Stack>
    )
  }

  return (
    <>
      <SnapshotListWrap>
        {snapshots.map((snapshot) => (
          <SnapshotItem key={snapshot.id} item={snapshot} onClick={onClickItem} />
        ))}
      </SnapshotListWrap>
      <SnapshotDrawer visible={panelVisible} snapshotId={activeSnapshotId} onClose={hidePanel} />
    </>
  )
}

const SnapshotItem: FC<{
  item: SnapshotSchema
  onClick: (item: SnapshotSchema) => void
}> = ({ item, onClick }) => {
  const onClickCard = useCallback(() => {
    onClick(item)
  }, [item, onClick])

  return (
    <DocumentCard styles={cardStyle} onClick={onClickCard}>
      <SnapshotCardHeader>
        <SnapshotStatusTag status={item.status} />
        <TooltipHost
          content={item.title}
          styles={{
            root: {
              overflow: 'hidden',
              display: 'block',
            },
          }}
        >
          <SnapshotTitle>{item.title}</SnapshotTitle>
        </TooltipHost>
      </SnapshotCardHeader>
      <SnapshotMeta snapshot={item} />
    </DocumentCard>
  )
}
