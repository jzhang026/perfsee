import { ForwardedRef, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'

import { Flamechart, FlamechartFrame } from '../lib/flamechart'
import { Vec2 } from '../lib/math'
import { NetworkFrame } from '../lib/network-profile'
import { CallTreeNode, Frame } from '../lib/profile'
import { Timing } from '../lib/timing'
import { TimingFrame } from '../lib/timing-profile'
import { lightTheme, Theme } from '../themes/theme'
import { FlamechartView } from '../views'
import { FlamechartBindingManager } from '../views/flamechart-binding-manager'

import { FlamechartDetailView } from './flamechart-detail-view'
import { Hovertip } from './hovertip'
import SplitView from './split-view'
import { CallTreeNodeTooltip } from './tooltip/calltreenode-tooltip'
import { NetworkTreeNodeTooltip } from './tooltip/networktreenode-tooltip'
import { TimingTreeNodeTooltip } from './tooltip/timingnode-tooltip'

const SplitViewDefaultGrow = [1, 0]
const SplitViewDefaultSize = [1, 0]
const SplitViewMinSize = [150, 150]
const SplitViewMinSizeNoDetailView = [150, 0]

export type FlamechartDblclickCallback = (dblclick: {
  node: CallTreeNode
  event: MouseEvent
  preventDefault: () => void
}) => void

export interface FocusProps {
  key: string
}

export interface FlamechartViewProps {
  flamechart: Flamechart
  bindingManager?: FlamechartBindingManager
  theme?: Theme
  onOpenFile?: (frame: Frame) => void
  onSelectFrame?: (frame: FlamechartFrame | null) => void
  timings?: Timing[]
  initialLeft?: number
  initialRight?: number
  disableDetailView?: boolean
  disableTimeIndicators?: boolean
  width: number
  height: number
  topPadding?: number
  bottomTimingLabels?: boolean
  bottomPadding?: number
  hiddenFrameLabels?: boolean
  minLeft?: number
  maxRight?: number
  style?: React.CSSProperties
}

export type FlamechartViewContainerRef = FlamechartView | undefined

export const FlamechartViewContainer = memo(
  forwardRef(
    (
      {
        flamechart,
        bindingManager,
        theme = lightTheme,
        onOpenFile,
        onSelectFrame,
        timings,
        initialLeft,
        initialRight,
        width,
        height,
        topPadding,
        bottomTimingLabels,
        bottomPadding,
        hiddenFrameLabels,
        minLeft,
        maxRight,
        disableDetailView,
        disableTimeIndicators,
        style,
      }: FlamechartViewProps,
      ref: ForwardedRef<FlamechartViewContainerRef>,
    ) => {
      const [selectedFrame, setSelectedFrame] = useState<FlamechartFrame | null>(null)
      const [hoverFrame, onFrameHover] = useState<{ frame: FlamechartFrame; event: MouseEvent } | null>(null)
      const [externalHoverFrame, onExternalHoverFrame] = useState<FlamechartFrame | null>(null)
      const [flamechartContainer, setFlamechartContainer] = useState<HTMLDivElement | null>(null)
      const [splitSize, setSplitSize] = useState<number[]>([100, 200])
      const [view, setView] = useState<FlamechartView>()

      useImperativeHandle(ref, () => view, [view])

      const tooltip = useMemo(() => {
        if (!hoverFrame) {
          return <Hovertip theme={theme} />
        }

        const offset = new Vec2(hoverFrame.event.clientX, hoverFrame.event.clientY)

        return (
          <Hovertip offset={offset} theme={theme}>
            {hoverFrame.frame.node.frame instanceof TimingFrame ? (
              <TimingTreeNodeTooltip frame={hoverFrame.frame.node.frame} />
            ) : hoverFrame.frame.node.frame instanceof NetworkFrame ? (
              <NetworkTreeNodeTooltip frame={hoverFrame.frame.node.frame} />
            ) : (
              <CallTreeNodeTooltip node={hoverFrame.frame.node} theme={theme} formatValue={flamechart.formatValue} />
            )}
          </Hovertip>
        )
      }, [hoverFrame, theme, flamechart.formatValue])

      const handleSelectFlamechart = useCallback(
        (frame: FlamechartFrame | null) => {
          onSelectFrame?.(frame)
          setSelectedFrame(frame)
        },
        [onSelectFrame],
      )

      const handleSelectDetailView = useCallback(
        (frame: FlamechartFrame) => {
          if (!frame) return
          if (!view) return

          view.focusToFrame(frame)
        },
        [view],
      )

      const handleHoverDetailView = useCallback(
        (frame: FlamechartFrame | null) => {
          onExternalHoverFrame(frame)
          view?.setHoverFrame(frame ?? undefined)
        },
        [view],
      )

      const detailViewHoverFrame = hoverFrame?.frame ?? externalHoverFrame
      const detailView = !disableDetailView && selectedFrame && (
        <FlamechartDetailView
          flamechart={flamechart}
          theme={theme}
          selectedFrame={selectedFrame}
          onSelectFrame={handleSelectDetailView}
          onHoverFrame={handleHoverDetailView}
          onOpenFile={onOpenFile}
          ext={externalHoverFrame}
          hoverFrame={detailViewHoverFrame}
        />
      )

      useEffect(() => {
        if (flamechartContainer) {
          const newView = new FlamechartView(flamechartContainer, flamechart, timings ?? [], theme, bindingManager, {
            initialLeft,
            initialRight,
            minLeft,
            maxRight,
            topPadding,
            disableTimeIndicators,
            bottomTimingLabels,
            bottomPadding,
            hiddenFrameLabels,
            onNodeSelect: handleSelectFlamechart,
            onNodeHover: onFrameHover,
          })

          setView(newView)
          return () => {
            newView.dispose()
          }
        }
      }, [
        bindingManager,
        disableTimeIndicators,
        flamechart,
        flamechartContainer,
        handleSelectFlamechart,
        initialLeft,
        initialRight,
        bottomTimingLabels,
        bottomPadding,
        maxRight,
        minLeft,
        theme,
        timings,
        topPadding,
        hiddenFrameLabels,
      ])

      return (
        <div style={{ position: 'relative', height, overflow: 'hidden', ...style }}>
          {!disableDetailView ? (
            <SplitView
              width={width}
              height={height}
              minSize={selectedFrame ? SplitViewMinSize : SplitViewMinSizeNoDetailView}
              size={selectedFrame ? splitSize : SplitViewDefaultSize}
              grow={SplitViewDefaultGrow}
              onSizeChange={selectedFrame ? setSplitSize : void 0}
              direction="column"
            >
              <div ref={setFlamechartContainer} style={{ width, height }} />
              {detailView ?? <></>}
            </SplitView>
          ) : (
            <div ref={setFlamechartContainer} style={{ width, height }} />
          )}
          {tooltip}
        </div>
      )
    },
  ),
)
