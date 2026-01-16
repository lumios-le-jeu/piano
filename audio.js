class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Avoid clipping
        this.masterGain.connect(this.ctx.destination);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Returns a "voice" object: { osc, osc2, gainNode, stop: function() }
    startTone(name, frequency) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        let gainNode = this.ctx.createGain();
        let filter = null;

        // Default stop function (overridden per instrument if needed)
        // We attach this to the return object so the App can call voice.stop()
        const stop = () => {
            const release = 0.2;
            const t = this.ctx.currentTime;
            gainNode.gain.cancelScheduledValues(t);
            gainNode.gain.setValueAtTime(gainNode.gain.value, t);
            gainNode.gain.exponentialRampToValueAtTime(0.001, t + release);
            osc.stop(t + release + 0.1);
            if (name === 'accordion' || name === 'steeldrum' || name === 'synth' || name === 'organ') {
                osc2.stop(t + release + 0.1);
            }
        };

        // --- Helper: Attack to Sustain ---
        // We no longer ramp to 0 automatically. We ramp to 'sustainLevel' and stay there.
        const applyEnvelope = (attack, decay, sustainLevel) => {
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(1, now + attack);
            // Decays to sustainLevel and HOLDS
            gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainLevel), now + attack + decay);
        };

        switch (name) {
            case 'piano':
                osc.type = 'triangle';
                // Piano decays naturally even if held, but we'll let it sustain a bit for "pad" feel or just long decay?
                // Actually true piano decays. Let's make it sustain slightly to satisfy user request "continue le son"
                applyEnvelope(0.01, 0.3, 0.2);

                filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 1000;
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'trumpet':
                osc.type = 'sawtooth';
                applyEnvelope(0.05, 0.1, 0.8);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(500, now);
                filter.frequency.linearRampToValueAtTime(2500, now + 0.1);
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'flute':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, now);
                applyEnvelope(0.1, 0.1, 0.9);
                osc.connect(gainNode);
                break;

            case 'violin':
                osc.type = 'sawtooth';
                applyEnvelope(0.3, 0.2, 0.8);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 500;
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'guitar':
                osc.type = 'sawtooth';
                // Guitar fails to sustain usually, but we force it for this mode
                applyEnvelope(0.01, 0.4, 0.2);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(3000, now);
                filter.frequency.exponentialRampToValueAtTime(500, now + 0.2);
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'saxophone':
                osc.type = 'square';
                applyEnvelope(0.1, 0.1, 0.8);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(400, now);
                filter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'marimba':
                osc.type = 'sine';
                // Marimba is short. Force a little sustain?
                applyEnvelope(0.01, 0.1, 0.0); // Natural decay to silence
                // Override stop to be instant since it's already gone? 
                // Let's keep it typical marimba: decays anyway.
                osc.connect(gainNode);
                break;

            case 'banjo':
                osc.type = 'sawtooth';
                applyEnvelope(0.01, 0.2, 0.1);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 1000;
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'synth':
                osc.type = 'sawtooth';
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(frequency * 1.01, now);
                osc2.start(now);
                applyEnvelope(0.01, 0.1, 0.5);
                osc.connect(gainNode);
                osc2.connect(gainNode);
                break;

            case 'oboe':
                osc.type = 'sawtooth';
                applyEnvelope(0.05, 0.1, 0.8);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1500;
                filter.Q.value = 1;
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'harp':
                osc.type = 'triangle';
                applyEnvelope(0.01, 0.5, 0.1);
                osc.connect(gainNode);
                break;

            case 'celesta':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency * 2, now);
                applyEnvelope(0.001, 0.2, 0.0); // Bell like
                osc.connect(gainNode);
                break;

            case 'accordion':
                osc.type = 'square';
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(frequency * 1.005, now);
                osc2.start(now);
                applyEnvelope(0.05, 0.1, 0.9);
                osc.connect(gainNode);
                osc2.connect(gainNode);
                break;

            case 'sitar':
                osc.type = 'sawtooth';
                applyEnvelope(0.01, 0.3, 0.5);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(3000, now);
                filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                filter.Q.value = 5;
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'koto':
                osc.type = 'triangle';
                applyEnvelope(0.01, 0.1, 0.0);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 800;
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            case 'steeldrum':
                osc.type = 'sine';
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(frequency * 2.5, now);
                osc2.start(now);
                applyEnvelope(0.01, 0.2, 0.0);
                osc.connect(gainNode);
                osc2.connect(gainNode);
                break;

            case '8bit':
                osc.type = 'square';
                applyEnvelope(0.001, 0.1, 0.5);
                osc.connect(gainNode);
                break;

            case 'bass':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency * 0.5, now);
                applyEnvelope(0.01, 0.3, 0.5);
                osc.connect(gainNode);
                break;

            case 'organ':
                osc.type = 'triangle';
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(frequency * 2, now);
                osc2.start(now);
                applyEnvelope(0.05, 0.1, 1.0); // Full sustain
                osc.connect(gainNode);
                osc2.connect(gainNode);
                break;

            case 'clarinet':
                osc.type = 'square';
                applyEnvelope(0.05, 0.1, 0.8);
                filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 2000;
                osc.connect(filter);
                filter.connect(gainNode);
                break;

            default:
                osc.type = 'triangle';
                applyEnvelope(0.01, 0.1, 0.5);
                osc.connect(gainNode);
                break;
        }

        gainNode.connect(this.masterGain);

        // Only set frequency if not processed inside switch (like flute/celesta special cases)
        // Some cases above set freq manually or use filters. 
        // Safer to set it if default logic applies? 
        // Most cases above just set type/filter. But they rely on this check:
        if (name !== 'flute' && name !== 'celesta' && name !== 'bass' && name !== 'synth' && name !== 'steeldrum' && name !== 'organ' && name !== 'accordion') {
            osc.frequency.setValueAtTime(frequency, now);
        }

        osc.start(now);

        return { osc, gainNode, stop };
    }

    playTrumpet(frequency, duration = 0.5) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sawtooth'; // Brassy sound
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.8, now + 0.05); // Brassy attack
        gainNode.gain.exponentialRampToValueAtTime(0.4, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Lowpass filter for warmth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start();
        osc.stop(now + duration);
    }

    playDrum(sound) {
        const now = this.ctx.currentTime;

        switch (sound) {
            case 'kick':
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.type = 'sine';
                kickOsc.frequency.setValueAtTime(150, now);
                kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
                kickGain.gain.setValueAtTime(1, now);
                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                kickOsc.connect(kickGain);
                kickGain.connect(this.masterGain);
                kickOsc.start(now);
                kickOsc.stop(now + 0.5);
                break;

            case 'snare':
                this.playNoise(0.2);
                this.playTone(200, 'triangle', 0.1);
                break;

            case 'hihat':
                this.playNoise(0.05, 1000);
                break;

            case 'tom1':
            case 'tom':
                const t1Osc = this.ctx.createOscillator();
                const t1Gain = this.ctx.createGain();
                t1Osc.type = 'sine';
                t1Osc.frequency.setValueAtTime(200, now);
                t1Osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                t1Gain.gain.setValueAtTime(1, now);
                t1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                t1Osc.connect(t1Gain);
                t1Gain.connect(this.masterGain);
                t1Osc.start(now);
                t1Osc.stop(now + 0.3);
                break;

            case 'tom2':
                const t2Osc = this.ctx.createOscillator();
                const t2Gain = this.ctx.createGain();
                t2Osc.type = 'sine';
                t2Osc.frequency.setValueAtTime(150, now);
                t2Osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
                t2Gain.gain.setValueAtTime(1, now);
                t2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                t2Osc.connect(t2Gain);
                t2Gain.connect(this.masterGain);
                t2Osc.start(now);
                t2Osc.stop(now + 0.3);
                break;

            case 'clap':
                this.playNoise(0.1, 800);
                break;

            case 'crash':
                this.playNoise(1.0, 500); // Longer noise
                break;

            case 'openhat':
                this.playNoise(0.4, 800);
                break;

            case 'ride':
                this.playTone(5000, 'square', 0.1); // Metallic ping
                break;

            case 'cowbell':
                this.playTone(800, 'square', 0.1);
                this.playTone(1200, 'square', 0.1);
                break;
        }
    }

    playNoise(duration, highPassFreq = 0) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        let output = noise;

        if (highPassFreq > 0) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = highPassFreq;
            noise.connect(filter);
            output = filter;
        }

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        output.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }
}
