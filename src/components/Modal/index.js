import ReactModal from 'react-modal'
import { h } from 'preact'
import classNames from 'classnames'
import { withFullScreenState } from '../FullScreen'
import { getCSSMillisecsValue } from '~utils'
import { useLocales } from '~locales'
import style from './style.scss'
import styleConstants from '../Theme/constants.scss'
import theme from '../Theme/style.scss'

const MODAL_ANIMATION_DURATION = getCSSMillisecsValue(
  styleConstants.modal_animation_duration
)

const Modal = ({
  children,
  isOpen,
  isFullScreen,
  onRequestClose,
  containerId,
  containerEl,
  shouldCloseOnOverlayClick = true,
}) => {
  const { translate } = useLocales()
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      portalClassName={theme.portal}
      overlayClassName={{
        base: theme.modalOverlay,
        afterOpen: theme['modalOverlay--after-open'],
        beforeClose: theme['modalOverlay--before-close'],
      }}
      bodyOpenClassName={theme.modalBody}
      className={classNames(theme.modalInner, style.inner)}
      role={'dialog'}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      closeTimeoutMS={MODAL_ANIMATION_DURATION}
      appElement={containerEl || document.getElementById(containerId)}
    >
      <button
        type="button"
        aria-label={translate('generic.accessibility.close_sdk_screen')}
        onClick={onRequestClose}
        className={classNames(style.closeButton, {
          [style.closeButtonFullScreen]: isFullScreen,
        })}
      >
        <span className={style.closeButtonLabel} aria-hidden="true">
          {translate('generic.close')}
        </span>
      </button>
      {children}
    </ReactModal>
  )
}

const ModalContainer = withFullScreenState(Modal)

const WrappedModal = ({ useModal, children, ...otherProps }) =>
  useModal ? (
    <ModalContainer {...otherProps}>{children}</ModalContainer>
  ) : (
    <div className={style.inner}>{children}</div>
  )

export default WrappedModal
