export class AudioRecorder {
  private ctx!: AudioContext
  private source!: MediaStreamAudioSourceNode
  private processor!: ScriptProcessorNode
  private stream!: MediaStream

  async start(onChunk: (data: ArrayBuffer) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.ctx = new AudioContext({ sampleRate: 16000 })

    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1)

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0)
      const buffer = new ArrayBuffer(input.length * 2)
      const view = new DataView(buffer)

      let offset = 0
      for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      }

      onChunk(buffer)
    }

    this.source.connect(this.processor)
    this.processor.connect(this.ctx.destination)
  }

  stop() {
    this.processor?.disconnect()
    this.source?.disconnect()
    this.stream?.getTracks().forEach(t => t.stop())
    this.ctx?.close()
  }
}
