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

import { PlayCircleFilled } from '@ant-design/icons'
import { Modal } from '@fluentui/react'
import { FC, memo, createRef, useState, useCallback } from 'react'

import { useToggleState } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'

import { VideoButton, VideoTime } from './style'

type VideoProps = {
  video: string
}

export const SnapshotVideo: FC<VideoProps> = memo(({ video }) => {
  const videoRef = createRef<HTMLVideoElement>()
  const [videoTime, setVideoTime] = useState<number>(0)
  const [visible, show, hide] = useToggleState(false)

  const onTimeUpdate = useCallback(() => {
    const time = videoRef.current?.currentTime
    if (time) {
      setVideoTime(time)
    }
  }, [videoRef])

  const formatted = formatTime(videoTime * 1000)

  return (
    <>
      <VideoButton onClick={show}>
        <PlayCircleFilled />
        Render video
      </VideoButton>
      <Modal
        isOpen={visible}
        onDismiss={hide}
        styles={{ main: { minWidth: 'auto' }, scrollableContent: { display: 'flex' } }}
      >
        <video ref={videoRef} onTimeUpdate={onTimeUpdate} controls src={video} />
        <VideoTime>
          {formatted.value}
          {formatted.unit}
        </VideoTime>
      </Modal>
    </>
  )
})
