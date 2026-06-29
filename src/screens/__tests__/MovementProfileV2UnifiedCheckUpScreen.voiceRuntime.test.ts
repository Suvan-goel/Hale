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
