/* eslint-disable import/no-unresolved, import/extensions */
import React, {PureComponent} from 'react';
import {Animated, Dimensions, Easing, PanResponder, StyleSheet, View} from 'react-native';
import {PropTypes} from 'prop-types';
/* eslint-enable import/no-unresolved, import/extensions */

function noop() {}

export default class Swipeable extends PureComponent {

  static propTypes = {
    // elements
    children: PropTypes.any,
    rightContent: PropTypes.any,
    rightButtons: PropTypes.array,

    // right action lifecycle
    onRightActionActivate: PropTypes.func,
    onRightActionDeactivate: PropTypes.func,
    onRightActionRelease: PropTypes.func,
    onRightActionComplete: PropTypes.func,
    rightActionActivationDistance: PropTypes.number,
    rightActionReleaseAnimationFn: PropTypes.func,
    rightActionReleaseAnimationConfig: PropTypes.object,


    // right buttons lifecycle
    onRightButtonsActivate: PropTypes.func,
    onRightButtonsDeactivate: PropTypes.func,
    onRightButtonsOpenRelease: PropTypes.func,
    onRightButtonsOpenComplete: PropTypes.func,
    onRightButtonsCloseRelease: PropTypes.func,
    onRightButtonsCloseComplete: PropTypes.func,
    rightButtonWidth: PropTypes.number,
    rightButtonsActivationDistance: PropTypes.number,
    rightButtonsOpenReleaseAnimationFn: PropTypes.func,
    rightButtonsOpenReleaseAnimationConfig: PropTypes.object,
    rightButtonsCloseReleaseAnimationFn: PropTypes.func,
    rightButtonsCloseReleaseAnimationConfig: PropTypes.object,

    // base swipe lifecycle
    onSwipeStart: PropTypes.func,
    onSwipeMove: PropTypes.func,
    onSwipeRelease: PropTypes.func,
    onSwipeComplete: PropTypes.func,
    swipeReleaseAnimationFn: PropTypes.func,
    swipeReleaseAnimationConfig: PropTypes.object,

    // misc
    onRef: PropTypes.func,
    onPanAnimatedValueRef: PropTypes.func,
    swipeStartMinDistance: PropTypes.number,
    swipeStartMinLeftEdgeClearance: PropTypes.number,
    swipeStartMinRightEdgeClearance: PropTypes.number,
    disable: PropTypes.bool,
  };

  static defaultProps = {
    rightContent: null,
    rightButtons: null,

    // right action lifecycle
    onRightActionActivate: noop,
    onRightActionDeactivate: noop,
    onRightActionRelease: noop,
    onRightActionComplete: noop,
    rightActionActivationDistance: 125,
    rightActionReleaseAnimationFn: null,
    rightActionReleaseAnimationConfig: null,

    // right buttons lifecycle
    onRightButtonsActivate: noop,
    onRightButtonsDeactivate: noop,
    onRightButtonsOpenRelease: noop,
    onRightButtonsOpenComplete: noop,
    onRightButtonsCloseRelease: noop,
    onRightButtonsCloseComplete: noop,
    rightButtonWidth: 75,
    rightButtonsActivationDistance: 75,
    rightButtonsOpenReleaseAnimationFn: null,
    rightButtonsOpenReleaseAnimationConfig: null,
    rightButtonsCloseReleaseAnimationFn: null,
    rightButtonsCloseReleaseAnimationConfig: null,

    // base swipe lifecycle
    onSwipeStart: noop,
    onSwipeMove: noop,
    onSwipeRelease: noop,
    onSwipeComplete: noop,
    swipeReleaseAnimationFn: Animated.timing,
    swipeReleaseAnimationConfig: {
      toValue: {x: 0, y: 0},
      duration: 250,
      easing: Easing.elastic(0.5)
    },

    // misc
    onRef: noop,
    onPanAnimatedValueRef: noop,
    swipeStartMinDistance: 15,
    swipeStartMinLeftEdgeClearance: 0,
    swipeStartMinRightEdgeClearance: 0,
    bounceOnMount: false,
    disable: false,
  };

  state = {
    pan: new Animated.ValueXY(),
    width: 0,
    lastOffset: {x: 0, y: 0},
    rightActionActivated: false,
    rightButtonsActivated: false,
    rightButtonsOpen: false
  };

  UNSAFE_componentWillMount() {
    const {onPanAnimatedValueRef, onRef} = this.props;

    onRef(this);
    onPanAnimatedValueRef(this.state.pan);
  }

  componentDidMount() {
    if (this.props.bounceOnMount) {
      setTimeout(this._bounceOnMount, 700);
    }
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  recenter = (
    animationFn = this.props.swipeReleaseAnimationFn,
    animationConfig = this.props.swipeReleaseAnimationConfig,
    onDone
  ) => {
    const {pan} = this.state;

    this.setState({
      lastOffset: {x: 0, y: 0},
      rightActionActivated: false,
      rightButtonsActivated: false,
      rightButtonsOpen: false
    });

    pan.flattenOffset();

    animationFn(pan, animationConfig).start(onDone);
  };

  _bounceOnMount = () => {
    this.bounceRight(this.bounceLeft);
  };

  bounceRight = (onDone) => {
    this.setState({
      rightActionActivated: true,
      rightButtonsActivated: true,
      rightButtonsOpen: true
    });
    this._bounce({x: -50, y: 0}, onDone);
  };

  bounceLeft = () => {
    //
  };

  _bounce = (toValue, onDone) => {
    const {pan} = this.state;
    pan.flattenOffset();

    const {swipeReleaseAnimationFn, swipeReleaseAnimationConfig} = this.props;
    Animated.timing(pan, {
      toValue,
      duration: 250,
      easing: Easing.elastic(0.5)
    }).start(() => this.recenter(swipeReleaseAnimationFn, swipeReleaseAnimationConfig, () => onDone && onDone()));
  };

  _unmounted = false;

  _handlePan = Animated.event([null, {
    dx: this.state.pan.x,
    dy: this.state.pan.y
  }]);

  _handleMoveShouldSetPanResponder = (event, gestureState) => {
    const {swipeStartMinDistance, swipeStartMinLeftEdgeClearance, swipeStartMinRightEdgeClearance} = this.props;
    const gestureStartX = gestureState.moveX - gestureState.dx;
    return Math.abs(gestureState.dx) > swipeStartMinDistance
      && (swipeStartMinLeftEdgeClearance === 0
        || gestureStartX >= swipeStartMinLeftEdgeClearance)
      && (swipeStartMinRightEdgeClearance === 0
        || gestureStartX <= Dimensions.get('window').width - swipeStartMinRightEdgeClearance);
  };

  _handlePanResponderStart = (event, gestureState) => {
    if (this.props.disable) {
      return;
    }

    const {lastOffset, pan} = this.state;

    pan.setOffset(lastOffset);
    this.props.onSwipeStart(event, gestureState, this);
  };

  _handlePanResponderMove = (event, gestureState) => {
    if (this.props.disable) {
      return;
    }

    const {
      rightActionActivationDistance,
      rightButtonsActivationDistance,
      onRightActionActivate,
      onRightActionDeactivate,
      onRightButtonsActivate,
      onRightButtonsDeactivate,
      onSwipeMove
    } = this.props;
    const {
      lastOffset,
      rightActionActivated,
      rightButtonsActivated
    } = this.state;
    const {dx, vx} = gestureState;
    const x = dx + lastOffset.x;
    const hasRightButtons = this._hasRightButtons();
    const isSwipingRight = vx > 0;
    let nextRightActionActivated = rightActionActivated;
    let nextRightButtonsActivated = rightButtonsActivated;

    this._handlePan(event, gestureState);
    onSwipeMove(event, gestureState, this);

    if (!rightActionActivated && x <= -rightActionActivationDistance) {
      nextRightActionActivated = true;
      onRightActionActivate(event, gestureState, this);
    }

    if (rightActionActivated && x > -rightActionActivationDistance) {
      nextRightActionActivated = false;
      onRightActionDeactivate(event, gestureState, this);
    }

    if (!rightButtonsActivated && hasRightButtons && !isSwipingRight && x <= -rightButtonsActivationDistance) {
      nextRightButtonsActivated = true;
      onRightButtonsActivate(event, gestureState, this);
    }

    if (rightButtonsActivated && hasRightButtons && isSwipingRight) {
      nextRightButtonsActivated = false;
      onRightButtonsDeactivate(event, gestureState, this);
    }

    const needsUpdate =
      nextRightActionActivated !== rightActionActivated ||
      nextRightButtonsActivated !== rightButtonsActivated;

    if (needsUpdate) {
      this.setState({
        rightActionActivated: nextRightActionActivated,
        rightButtonsActivated: nextRightButtonsActivated
      });
    }
  };

  _handlePanResponderEnd = (event, gestureState) => {
    if (this.props.disable) {
      return;
    }

    const {
      onRightActionRelease,
      onRightActionDeactivate,
      onRightButtonsOpenRelease,
      onRightButtonsCloseRelease,
      onSwipeRelease
    } = this.props;
    const {
      rightActionActivated,
      rightButtonsOpen,
      rightButtonsActivated,
      pan
    } = this.state;
    const animationFn = this._getReleaseAnimationFn();
    const animationConfig = this._getReleaseAnimationConfig();

    onSwipeRelease(event, gestureState, this);

    if (rightActionActivated) {
      onRightActionRelease(event, gestureState, this);
    }

    if (rightButtonsActivated && !rightButtonsOpen) {
      onRightButtonsOpenRelease(event, gestureState, this);
    }

    if (!rightButtonsActivated && rightButtonsOpen) {
      onRightButtonsCloseRelease(event, gestureState, this);
    }

    this.setState({
      lastOffset: {x: animationConfig.toValue.x, y: animationConfig.toValue.y},
      rightActionActivated: false,
      rightButtonsOpen: rightButtonsActivated
    });

    pan.flattenOffset();

    animationFn(pan, animationConfig).start(() => {
      if (this._unmounted) {
        return;
      }

      const {
        onRightActionComplete,
        onRightButtonsOpenComplete,
        onRightButtonsCloseComplete,
        onSwipeComplete
      } = this.props;

      onSwipeComplete(event, gestureState, this);

      if (rightActionActivated) {
        onRightActionComplete(event, gestureState, this);
        onRightActionDeactivate(event, gestureState, this);
      }

      if (rightButtonsActivated && !rightButtonsOpen) {
        onRightButtonsOpenComplete(event, gestureState, this);
      }

      if (!rightButtonsActivated && rightButtonsOpen) {
        onRightButtonsCloseComplete(event, gestureState, this);
      }
    });
  };

  _panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
    onMoveShouldSetPanResponderCapture: this._handleMoveShouldSetPanResponder,
    onPanResponderGrant: this._handlePanResponderStart,
    onPanResponderMove: this._handlePanResponderMove,
    onPanResponderRelease: this._handlePanResponderEnd,
    onPanResponderTerminate: this._handlePanResponderEnd,
    onPanResponderTerminationRequest: this._handlePanResponderEnd
  });

  _handleLayout = ({nativeEvent: {layout: {width}}}) => this.setState({width});

  _canSwipeRight() {
    //
  }

  _canSwipeLeft() {
    return this.props.rightContent || this._hasRightButtons();
  }

  _hasLeftButtons() {
    //
  }

  _hasRightButtons() {
    const {rightButtons, rightContent} = this.props;

    return !rightContent && rightButtons && rightButtons.length;
  }

  _getReleaseAnimationFn() {
    const {
      rightActionReleaseAnimationFn,
      rightButtonsOpenReleaseAnimationFn,
      rightButtonsCloseReleaseAnimationFn,
      swipeReleaseAnimationFn
    } = this.props;
    const {
      rightActionActivated,
      rightButtonsActivated,
      rightButtonsOpen
    } = this.state;

    if (rightActionActivated && rightActionReleaseAnimationFn) {
      return rightActionReleaseAnimationFn;
    }

    if (rightButtonsActivated && rightButtonsOpenReleaseAnimationFn) {
      return rightButtonsOpenReleaseAnimationFn;
    }

    if (!rightButtonsActivated && rightButtonsOpen && rightButtonsCloseReleaseAnimationFn) {
      return rightButtonsCloseReleaseAnimationFn;
    }

    return swipeReleaseAnimationFn;
  }

  _getReleaseAnimationConfig() {
    const {
      rightActionReleaseAnimationConfig,
      rightButtons,
      rightButtonsOpenReleaseAnimationConfig,
      rightButtonsCloseReleaseAnimationConfig,
      rightButtonWidth,
      swipeReleaseAnimationConfig
    } = this.props;
    const {
      rightActionActivated,
      rightButtonsActivated,
      rightButtonsOpen
    } = this.state;

    if (rightActionActivated && rightActionReleaseAnimationConfig) {
      return rightActionReleaseAnimationConfig;
    }

    if (rightButtonsActivated) {
      return {
        ...swipeReleaseAnimationConfig,
        toValue: {
          x: rightButtons.length * rightButtonWidth * -1,
          y: 0
        },
        ...rightButtonsOpenReleaseAnimationConfig
      };
    }

    if (!rightButtonsActivated && rightButtonsOpen && rightButtonsCloseReleaseAnimationConfig) {
      return rightButtonsCloseReleaseAnimationConfig;
    }

    return swipeReleaseAnimationConfig;
  }

  _renderButtons(buttons) {
    const {rightButtonContainerStyle} = this.props;
    const {pan, width} = this.state;
    const count = buttons.length;
    const leftEnd = -width;

    const inputRange = [leftEnd, 0];

    return buttons.map((buttonContent, index) => {
      const outputMultiplier = -index / count;
      const outputRange = [leftEnd * outputMultiplier, 0];
      const transform = [{
        translateX: pan.x.interpolate({
          inputRange,
          outputRange,
          extrapolate: 'clamp'
        })
      }];
      const buttonStyle = [
        StyleSheet.absoluteFill,
        {width, transform},
        rightButtonContainerStyle
      ];

      return (
        <Animated.View key={index} style={buttonStyle}>
          {buttonContent}
        </Animated.View>
      );
    });
  }

  render() {
    const {
      children,
      contentContainerStyle,
      rightButtons,
      rightContainerStyle,
      rightContent,
      style,
    } = this.props;
    const {pan, width} = this.state;
    const transform = [{
      translateX: pan.x.interpolate({
        inputRange: [-width, 0],
        outputRange: [
          -width + StyleSheet.hairlineWidth,
          0
        ],
        extrapolate: 'clamp'
      })
    }];

    return (
      <View onLayout={this._handleLayout} style={[styles.container, style]} {...this._panResponder.panHandlers}>
        <Animated.View style={[{transform}, styles.content, contentContainerStyle]}>{children}</Animated.View>
        <Animated.View style={[{transform, marginRight: -width, width}, rightContainerStyle]}>
          {rightContent || this._renderButtons(rightButtons, false)}
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row'
  },
  content: {
    flex: 1
  }
});
