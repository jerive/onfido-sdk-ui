import { h, Component } from 'preact'
import { screenshot } from '~utils/camera'
import { mimeType } from '~utils/blob'
import { FaceOverlay } from '../Overlay'
import { ToggleFullScreen } from '../FullScreen'
import Timeout from '../Timeout'
import Camera from '../Camera'
import CameraError from '../CameraError'
import { SdkMetadata } from '~types/commons'
import Webcam from 'react-webcam-onfido'
import {
  WithLocalisedProps,
  WithPageIdProps,
  WithTrackingProps,
} from '~types/hocs'
import { ErrorProp, RenderFallbackProp } from '~types/routers'
import { CapturePayload } from '~types/redux'
import { CameraProps } from '~types/camera'

type State = {
  hasBecomeInactive: boolean
  hasCameraError: boolean
  snapshotBuffer: Array<{
    blob: Blob
  }>
  isCaptureButtonDisabled: boolean
  isProcessingSelfie: boolean
}

type Props = {
  onCapture: (payload: CapturePayload) => void
  renderFallback: RenderFallbackProp
  inactiveError: ErrorProp
  useMultipleSelfieCapture: boolean
  snapshotInterval: number
} & WithTrackingProps &
  WithLocalisedProps &
  WithPageIdProps

export default class SelfieCapture extends Component<Props, State> {
  webcam?: Webcam
  snapshotIntervalId = 0
  initialSnapshotTimeoutId = 0

  state: State = {
    hasBecomeInactive: false,
    hasCameraError: false,
    snapshotBuffer: [],
    isCaptureButtonDisabled: true,
    isProcessingSelfie: false,
  }

  handleTimeout = () => this.setState({ hasBecomeInactive: true })

  handleCameraError = () =>
    this.setState({ hasCameraError: true, isCaptureButtonDisabled: true })

  handleSelfie = (blob: Blob, sdkMetadata: SdkMetadata) => {
    const selfie = {
      blob,
      sdkMetadata,
      filename: `applicant_selfie.${mimeType(blob)}`,
    }
    /* Attempt to get the 'ready' snapshot. But, if that fails, try to get the fresh snapshot - it's better
       to have a snapshot, even if it's not an ideal one */
    const snapshot =
      this.state.snapshotBuffer[0] || this.state.snapshotBuffer[1]
    const captureData = this.props.useMultipleSelfieCapture
      ? { snapshot, ...selfie }
      : selfie
    this.props.onCapture(captureData)
    this.setState({ isCaptureButtonDisabled: false, isProcessingSelfie: false })
  }

  handleSnapshot = (blob: Blob) => {
    // Always try to get the older snapshot to ensure
    // it's different enough from the user initiated selfie
    this.setState(({ snapshotBuffer: [, newestSnapshot] }) => ({
      snapshotBuffer: [
        newestSnapshot,
        { blob, filename: `applicant_snapshot.${mimeType(blob)}` },
      ],
    }))
  }

  takeSnapshot = () => {
    const snapshot =
      this.state.snapshotBuffer[0] || this.state.snapshotBuffer[1]

    if (
      snapshot?.blob &&
      this.state.isCaptureButtonDisabled &&
      !this.state.isProcessingSelfie
    ) {
      this.setState({ isCaptureButtonDisabled: false })
    }
    this.webcam && screenshot(this.webcam, this.handleSnapshot)
  }

  takeSelfie = () => {
    if (!this.webcam) {
      return
    }

    // If we are already taking the selfie, we should stop taking snapshots to prevent them from being the
    // same as the Selfie itself, causing the multiframe feature to fail.
    this.stopSnapshots()
    this.setState({ isProcessingSelfie: true, isCaptureButtonDisabled: true })
    screenshot(this.webcam, this.handleSelfie)
  }

  onUserMedia = () => {
    if (this.props.useMultipleSelfieCapture) {
      // A timeout is required for this.webcam to load, else 'webcam is null' console error is displayed
      const initialSnapshotTimeout = 0
      //@ts-ignore it uses NodeJS types
      this.initialSnapshotTimeoutId = setTimeout(() => {
        this.takeSnapshot()
      }, initialSnapshotTimeout)
      //@ts-ignore it uses NodeJS types
      this.snapshotIntervalId = setInterval(
        this.takeSnapshot,
        this.props.snapshotInterval
      )
    } else {
      this.setState({ isCaptureButtonDisabled: false })
    }
  }

  stopSnapshots() {
    if (this.snapshotIntervalId) {
      clearInterval(this.snapshotIntervalId)
    }
    if (this.initialSnapshotTimeoutId) {
      clearTimeout(this.initialSnapshotTimeoutId)
    }
  }

  componentWillUnmount() {
    this.stopSnapshots()
  }

  render() {
    const { trackScreen, renderFallback, inactiveError, pageId } = this.props
    const {
      hasBecomeInactive,
      hasCameraError,
      isCaptureButtonDisabled, // Capture Button is disabled until camera access is allowed + userMedia stream is ready
    } = this.state

    const cameraProps: Omit<CameraProps, 'buttonType'> = {
      ...this.props,
    }

    const withTrackingProps: WithTrackingProps = {
      ...this.props,
    }

    return (
      <Camera
        {...cameraProps}
        {...withTrackingProps}
        webcamRef={(ref) => ref && (this.webcam = ref)}
        onUserMedia={this.onUserMedia}
        onError={this.handleCameraError}
        renderError={
          hasBecomeInactive ? (
            <CameraError
              {...{ trackScreen, renderFallback }}
              error={inactiveError}
              isDismissible
            />
          ) : null
        }
        buttonType="photo"
        onButtonClick={this.takeSelfie}
        isButtonDisabled={isCaptureButtonDisabled}
        pageId={pageId}
      >
        {!isCaptureButtonDisabled && !hasCameraError && (
          <Timeout seconds={10} onTimeout={this.handleTimeout} />
        )}
        <ToggleFullScreen />
        <FaceOverlay />
      </Camera>
    )
  }
}
