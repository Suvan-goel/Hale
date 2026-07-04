import fs from 'fs';
import path from 'path';

describe('MovementProfileV2UnifiedCheckUpScreen voice-runtime wiring', () => {
  const source = () =>
    fs.readFileSync(
      path.join(process.cwd(), 'src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx'),
      'utf8'
    );

  it('uses the foundation runtime without a rollback prop', () => {
    const text = source();

    expect(text).toContain('MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED');
    expect(text).toContain('const voiceRuntimeEnabled = MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED;');
    expect(text).not.toContain(['voiceExperience', 'Mode'].join(''));
    expect(text).toContain('new MovementProfileV2VoiceRuntime');
    expect(text).toContain('if (voiceRuntimeEnabled) return;');
    expect(text).toContain('voiceSequencerRef.current.next(live)');
  });

  it('guards required actions in both disabled UI props and the programmatic handler', () => {
    const text = source();

    expect(text).toContain('!getVoiceRuntime().canDispatchAction(action, liveRef.current)');
    expect(text).toContain("disabled: actionDisabled({ type: 'confirm_chair_setup' })");
    expect(text).toContain("disabled: actionDisabled({ type: 'start_shoulder_capture' })");
    expect(text).toContain("disabled: actionDisabled({ type: 'start_hinge_capture' })");
  });

  it('renders retry/cancel for required audio failure and does not offer continue without audio', () => {
    const text = source();

    expect(text).toContain("voiceRuntimeState.lastFailure");
    expect(text).toContain('Audio setup needed');
    expect(text).toContain('Try again');
    expect(text).toContain('Exit check-up');
    expect(text).not.toContain('Continue without audio');
  });

  it('persists the raw check-up before the outro and offers forward exit only once the battery is complete', () => {
    const text = source();

    // Save-on-raw-complete: the measured battery must never be hostage to the
    // outro cue or a crash between raw completion and onComplete.
    expect(text).toContain('onRawCheckUpReady?.({ checkUp: live.checkUp, sourceType })');
    // Forward exit on outro failure exists ONLY behind a completed check-up.
    expect(text).toContain("title: 'Continue to results'");
    const failureBranch = text.slice(
      text.indexOf('voiceRuntimeState.lastFailure) {'),
      text.indexOf('return movementProfileV2ShellControls')
    );
    expect(failureBranch).toContain('if (live.checkUp)');
    expect(failureBranch).toContain('finishNow');
  });

  it('confirms before discarding an in-progress battery on every close path', () => {
    const text = source();

    expect(text).toContain('const requestClose = React.useCallback');
    expect(text).toContain('setConfirmLeaveVisible(true)');
    expect(text).toContain('discardModal={{');
    expect(text).toContain('onRequestBack={requestClose}');
    expect(text).toContain("BackHandler.addEventListener('hardwareBackPress'");
    // Cancel controls route through the confirmation, not straight to onCancel.
    expect(text).toContain('onCancel: requestClose,');
  });

  it('gives transient iOS inactive states a grace window before invalidating the measurement', () => {
    const text = source();

    expect(text).toContain('APP_STATE_INACTIVE_GRACE_MS');
    expect(text).toContain("if (state === 'inactive')");
    expect(text).toContain('dispatchBackgrounded');
  });

  it('opens the hands-free check-up with the standing frame check and offers only a skip fallback', () => {
    const text = source();

    expect(text).toContain('standingFrameCheckEnabled: handsFreeMode');
    expect(text).toContain("case 'standing_frame_check':");
    expect(text).toContain('Skip camera check');
    expect(text).toContain("disabled: actionDisabled({ type: 'skip_frame_check' })");
    // No manual "confirm framing" — passing requires the camera-verified
    // standing calibration; the only manual path is skipping.
    expect(text).not.toContain('Confirm framing');
  });

  it('waits for completion narration before calling onComplete in the foundation path', () => {
    const text = source();

    expect(text).toContain('!voiceRuntimeState.completionReady');
    expect(text).toContain('onComplete({ checkUp: live.checkUp, sourceType })');
  });

  it('keeps visual wiring out of voice runtime dispatch', () => {
    const text = source();
    const visualStart = text.indexOf('<RecordingVisualSurface');
    const visualBlock = text.slice(visualStart, text.indexOf('/>', visualStart) + 2);

    expect(text).toContain('guidance={live.recordingVisualGuidance}');
    expect(visualBlock).not.toMatch(/getVoiceRuntime|voice\.|speak|canDispatchAction|receiveUserAction|runLiveAction/);
  });

  it('plays the rep-credit sound effect when the coordinator reports a new rep credit', () => {
    const text = source();

    expect(text).toContain('new SfxChannel()');
    expect(text).toContain('next.repCreditCount > lastRepCreditCountRef.current');
    expect(text).toContain("sfx.play('rep-credit')");
    expect(text).toContain('sfx.release()');
  });

  it('applies mounted voice changes through the runtime instead of remounting the channel path', () => {
    const text = source();

    expect(text).toContain('setDesiredVoiceId(voiceId ?? DEFAULT_VOICE_ID, liveRef.current)');
    expect(text).toContain('createVoiceChannel: (nextVoiceId) => new VoiceChannel(nextVoiceId)');
    expect(text).toContain('pendingVoiceId');
  });

  it('keeps the recovery screen on tracked scoped speech with unmount cancellation', () => {
    const text = fs.readFileSync(
      path.join(process.cwd(), 'src/screens/MovementProfileV2RecoveryScreen.tsx'),
      'utf8'
    );

    expect(text).toContain('voiceRecovery');
    expect(text).toContain('speakTracked');
    expect(text).toContain('mpv2:recovery-screen:');
    expect(text).toContain("cancelScope(scopeId, 'screen_unmounted')");
    expect(text).toContain('spokenRecoveryIdsRef');
  });
});
