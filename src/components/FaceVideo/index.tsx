import { h, Component } from 'preact'

import { currentMilliseconds } from '~utils'
import { sendScreen } from '../../Tracker'
import { localised } from '~locales'
import { FaceOverlay } from '../Overlay'
import withChallenges from './withChallenges'
import VideoCapture from '../VideoCapture'
import Challenge from './Challenge'
import Recording from './Recording'
import StartRecording from './StartRecording'

import type { ChallengePayload } from '~types/api'
import type {
  WithChallengesProps,
  WithLocalisedProps,
  WithTrackingProps,
} from '~types/hocs'
import type {
  ErrorProp,
  HandleCaptureProp,
  RenderFallbackProp,
  StepComponentFaceProps,
} from '~types/routers'

export type FaceVideoProps = {
  cameraClassName: string
  inactiveError: ErrorProp
  isUploadFallbackDisabled?: boolean
  onRedo: () => void
  onVideoCapture: HandleCaptureProp
  renderFallback: RenderFallbackProp
}

type Props = FaceVideoProps &
  StepComponentFaceProps &
  WithChallengesProps &
  WithLocalisedProps &
  WithTrackingProps

type State = {
  currentIndex: number
  startedAt?: number
  switchSeconds?: number
}

const initialState: State = {
  currentIndex: 0,
  startedAt: undefined,
  switchSeconds: undefined,
}

class FaceVideo extends Component<Props, State> {
  state = { ...initialState }

  onRecordingStart = () => {
    this.setState({ startedAt: currentMilliseconds() })
    sendScreen(['face_video_capture_step_1'])
  }

  onVideoCapture: HandleCaptureProp = (payload) => {
    const { switchSeconds } = this.state
    const { challenges, challengesId: id } = this.props
    const challengeData = { challenges, id, switchSeconds }
    this.props.onVideoCapture({ ...payload, challengeData })
  }

  handleNextChallenge = () => {
    const { startedAt, currentIndex } = this.state
    const { trackScreen } = this.props

    trackScreen('recording_next_click')
    this.setState({ currentIndex: currentIndex + 1 })

    if (startedAt) {
      this.setState({ switchSeconds: currentMilliseconds() - startedAt })
      sendScreen(['face_video_capture_step_2'])
    }
  }

  render = () => {
    const {
      cameraClassName,
      challenges = [],
      inactiveError,
      onRedo,
      renderFallback,
      isUploadFallbackDisabled,
      trackScreen,
      translate,
    } = this.props

    const { currentIndex } = this.state

    const currentChallenge =
      challenges[currentIndex] || ({} as ChallengePayload)
    const isLastChallenge = currentIndex === challenges.length - 1

    return (
      <VideoCapture
        audio
        cameraClassName={cameraClassName}
        inactiveError={inactiveError}
        isUploadFallbackDisabled={isUploadFallbackDisabled}
        method="face"
        onRecordingStart={this.onRecordingStart}
        onRedo={onRedo}
        onVideoCapture={this.onVideoCapture}
        renderFallback={renderFallback}
        pageId={'FaceVideo'}
        renderPhotoOverlay={({ hasCameraError, isRecording }) => (
          <FaceOverlay isWithoutHole={hasCameraError || isRecording} video />
        )}
        renderVideoOverlay={({
          disableInteraction,
          isRecording,
          onStart,
          onStop,
        }) =>
          isRecording ? (
            <Recording
              hasMoreSteps={!isLastChallenge}
              disableInteraction={disableInteraction}
              onNext={this.handleNextChallenge}
              onStop={onStop}
            >
              <Challenge challenge={currentChallenge} />
            </Recording>
          ) : (
            <StartRecording
              disableInteraction={disableInteraction}
              onStart={onStart}
            />
          )
        }
        title={translate('video_capture.body')}
        trackScreen={trackScreen}
      />
    )
  }
}

export default localised(withChallenges(FaceVideo))
